from pathlib import Path

import numpy as np
import onnx
import torch
import torch.utils.benchmark as benchmark
from onnxruntime import InferenceSession
from torch.autograd import Variable
from torch.onnx import verification

from model import PPNet


def to_numpy(t: torch.Tensor) -> np.ndarray:
    return t.detach().cpu().numpy() if t.requires_grad else t.cpu().numpy()


def load_model(model_path: Path) -> PPNet:
    """Loads the model from the given path.

    Args:
        model_path: Path to the model file.

    Returns:
        The loaded model.
    """
    # Make sure model file exists
    if not model_path.exists():
        raise FileNotFoundError(f"Model {model_path!r} does not exist!")

    # Load model
    model: PPNet = torch.load(model_path, map_location="cpu")
    model.eval()

    return model


def sanity_check(model: PPNet, info_file: Path) -> bool:
    """Checks if the given model behaves as expected.
    Should be called after loading the model.

    Args:
        model: The model to check.
        info_file: The path to the prototype info file.

    Returns:
        True if the model behaves as expected, False otherwise.
    """
    # Make sure info file exists
    if not info_file.exists():
        raise FileNotFoundError(f"Info file {info_file!r} does not exist!")

    # Load prototype info
    info = np.load(info_file)
    identity = info[:, -1]

    # Make sure prototype connects most strongly to itself
    max_conn = torch.argmax(model.last_layer.weight, dim=0)
    max_conn = max_conn.cpu().numpy()
    return np.sum(max_conn == identity) == model.num_prototypes


def export(model: PPNet, export_path: Path, verbose: bool = False) -> None:
    """Exports the model to ONNX format.

    Args:
        model: The model to export.
        export_path: Where to save the exported ONNX file.
    """
    torch.manual_seed(0)

    opset_version = 11
    input_names = ["image"]
    output_names = ["logits", "prototype_activations", "prototype_activation_patterns"]
    do_constant_folding = False

    # Make sure model is in evaluation mode
    if model.training:
        model.eval()

    # Create dummy input
    dummy = Variable(torch.randn(1, 3, model.img_size, model.img_size)).cpu()

    # Verify the model
    try:
        verification.verify(
            model,
            dummy,
            opset_version=opset_version,
            do_constant_folding=do_constant_folding,
            input_names=input_names,
            output_names=output_names,
        )
    except onnx.onnx_cpp2py_export.checker.ValidationError as e:
        print(e)
        exit(1)

    # Find mismatch
    verification.find_mismatch(
        model,
        (dummy,),
        opset_version=opset_version,
        do_constant_folding=do_constant_folding,
    )

    # Export the model
    # scripted_model = torch.jit.script(model)
    torch.onnx.export(
        # scripted_model,
        model,
        dummy,
        export_path,
        export_params=True,
        opset_version=opset_version,
        input_names=input_names,
        output_names=output_names,
        do_constant_folding=do_constant_folding,
        verbose=verbose,
    )

    return model


def validate(onnx_path: Path) -> bool:
    """Checks if the exported ONNX model is valid.

    Args:
        onnx_path: The path to the exported ONNX file.

    Returns:
        True if the model is valid, False otherwise.
    """
    # Make sure the file exists
    if not onnx_path.exists():
        raise FileNotFoundError(f"File {onnx_path!r} does not exist.")

    # Load the model
    model = onnx.load(onnx_path)

    # Check if the model is valid
    try:
        onnx.checker.check_model(model, True)
    except onnx.onnx_cpp2py_export.checker.ValidationError as e:
        print(e)
        return False
    return True


def compare(model: PPNet, onnx_path: Path) -> bool:
    """Compares the output of the model with the output of the ONNX model.

    Args:
        model: The model to compare.
        onnx_path: The path to the exported ONNX file.

    Returns:
        True if the outputs are equal, False otherwise.
    """
    torch.manual_seed(0)

    # Create dummy input
    dummy = Variable(torch.randn(1, 3, model.img_size, model.img_size)).cpu()

    # Run the model
    torch_outs = model(dummy)

    # Load the ONNX model
    ort_session = InferenceSession(onnx_path, providers=["CPUExecutionProvider"])

    # Compute ONNX Runtime output prediction
    # ort_inputs = {ort_session.get_inputs()[0].name: dummy.numpy()}
    ort_outs = ort_session.run(
        ["logits", "prototype_activations", "prototype_activation_patterns"], {"image": to_numpy(dummy)}
    )

    # Compare ONNX Runtime and PyTorch results
    try:
        assert len(torch_outs) == len(ort_outs)
        # torch.testing.assert_close(to_numpy(torch_outs[0]), ort_outs[0], rtol=1e-03, atol=1e-05)
        for torch_out, ort_out in zip(torch_outs, ort_outs):
            torch.testing.assert_close(to_numpy(torch_out), ort_out)
    except AssertionError as e:
        print(e)
        return False
    return True


def benchmark_models(model: PPNet, onnx_path: Path) -> tuple[float, float]:
    """Benchmarks the model and the ONNX model.

    Args:
        model: The model to benchmark.
        onnx_path: The path to the exported ONNX file.

    Returns:
        A tuple containing the time it took to run the model and the ONNX model.
    """
    torch.manual_seed(0)

    # Create dummy input
    def dummy_input():
        return torch.randn(1, 3, model.img_size, model.img_size).cpu()

    # Benchmark model
    torch_t = benchmark.Timer(
        stmt="model(dummy)",
        globals={"model": model, "dummy_input": dummy_input},
        setup="dummy = dummy_input()",
        label="PyTorch",
    ).blocked_autorange(min_run_time=1)

    # Benchmark ONNX model
    ort_session = InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
    onnx_t = benchmark.Timer(
        stmt="ort_session.run(None, ort_inputs)",
        globals={"ort_session": ort_session, "dummy_input": dummy_input},
        setup="ort_inputs = {ort_session.get_inputs()[0].name: dummy_input().numpy()}",
        label="ONNX",
    ).blocked_autorange(min_run_time=1)

    return torch_t.median, onnx_t.median


if __name__ == "__main__":
    model_path = Path("model/100push0.7413.pth")
    info_file = Path("model/bb100.npy")
    # onnx_path = model_path.with_suffix(".onnx")
    onnx_path = Path("model/exported.onnx")

    model = load_model(model_path)
    print(model)

    is_sane = sanity_check(model, info_file)
    print(f"Model is sane: {is_sane}")
    if not is_sane:
        exit(1)

    export(model, onnx_path)

    is_valid = validate(onnx_path)
    print(f"ONNX model is valid: {is_valid}")

    is_equal = compare(model, onnx_path)
    print(f"Outputs are equal: {is_equal}")

    torch_t, onnx_t = benchmark_models(model, onnx_path)
    print(f"Benchmark: PyTorch: {torch_t:.4f}s, ONNX: {onnx_t:.4f}s")
