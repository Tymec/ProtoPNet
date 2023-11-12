import time
from pathlib import Path
from typing import Callable

import numpy as np
import onnx
import torch
from onnxruntime import InferenceSession
from torch.utils import benchmark
from torch.utils.data import DataLoader
from torchvision import transforms
from torchvision.datasets import ImageFolder

from model import PPNet

# DEVICE = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
DEVICE = torch.device("cpu")
BATCH_SIZE = 1
MEAN = (0.485, 0.456, 0.406)
STD = (0.229, 0.224, 0.225)


def load_torch_model(model_path: Path) -> PPNet:
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
    model: PPNet = torch.load(model_path, map_location=DEVICE)
    model.eval()

    return model


def load_onnx(onnx_path: Path) -> InferenceSession:
    """Loads the ONNX model from the given path.

    Args:
        onnx_path: Path to the ONNX model file.

    Returns:
        The loaded ONNX model.
    """
    # Make sure model file exists
    if not onnx_path.exists():
        raise FileNotFoundError(f"Model {onnx_path!r} does not exist!")

    # Load model
    return InferenceSession(onnx_path, providers=["CPUExecutionProvider"])


def load_torchscript(ts_path: Path) -> torch.jit.ScriptModule:
    """Loads the TorchScript model from the given path.

    Args:
        ts_path: Path to the TorchScript model file.

    Returns:
        The loaded TorchScript model.
    """
    # Make sure model file exists
    if not ts_path.exists():
        raise FileNotFoundError(f"Model {ts_path!r} does not exist!")

    # Load model
    return torch.jit.load(ts_path, map_location=DEVICE)


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


def export_onnx(model: PPNet, export_path: Path, dummy: torch.Tensor = None) -> None:
    """Exports the model to ONNX format.

    Args:
        model: The model to export.
        export_path: Where to save the exported ONNX file.
        dummy: The dummy input to use for tracing.
    """
    opset_version = 17
    input_names = ["image"]
    output_names = ["logits", "min_distances", "prototype_activations", "prototype_activation_patterns"]
    do_constant_folding = False

    # Make sure export path exists
    export_path.parent.mkdir(parents=True, exist_ok=True)

    # Create dummy input if not given
    if dummy is None:
        dummy = torch.randn(BATCH_SIZE, 3, model.img_size, model.img_size).to(DEVICE)

    # Verify the model
    # verification.verify

    # Find mismatch
    # verification.find_mismatch(
    #     model,
    #     (dummy,),
    #     opset_version=opset_version,
    #     do_constant_folding=do_constant_folding,
    # )

    # Export the model
    scripted_model = torch.jit.script(model)
    torch.onnx.export(
        scripted_model,
        # model,
        dummy,
        export_path,
        export_params=True,
        opset_version=opset_version,
        input_names=input_names,
        output_names=output_names,
        do_constant_folding=do_constant_folding,
        # dynamic_axes={
        #     "image": {0: "batch_size"},
        #     "logits": {0: "batch_size"},
        #     "min_distances": {0: "batch_size"},
        #     "prototype_activations": {0: "batch_size"},
        #     "prototype_activation_patterns": {0: "batch_size"},
        # },
    )


def export_torchscript(model: PPNet, export_path: Path, dummy: torch.Tensor = None, scripted: bool = False) -> None:
    """Exports the model to TorchScript format.

    Args:
        model: The model to export.
        export_path: Where to save the exported TorchScript file.
        dummy: The dummy input to use for tracing.
    """
    # Make sure export path exists
    export_path.parent.mkdir(parents=True, exist_ok=True)

    # Create dummy input if not given
    if dummy is None:
        dummy = torch.randn(BATCH_SIZE, 3, model.img_size, model.img_size).to(DEVICE)

    # Export the model
    if not scripted:
        module = torch.jit.trace(model, dummy)
    else:
        module = torch.jit.script(model, dummy)
    torch.jit.optimize_for_inference(module)
    # torch.jit.enable_onednn_fusion(True)
    module.save(export_path)


def validate_onnx(onnx_path: Path) -> bool:
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
    except Exception as e:
        print(e)
        return False
    return True


def run_onnx(ort_session: InferenceSession, inp: torch.Tensor) -> list[torch.Tensor]:
    """Runs the given input through the given ONNX model.

    Args:
        ort_session: The ONNX model to run.
        inp: The input to run through the model.

    Returns:
        The output of the model.
    """
    # Make sure the input is on the correct device
    inp = inp.to(DEVICE)

    # Run the model
    ort_inputs = {ort_session.get_inputs()[0].name: inp.cpu().numpy()}
    ort_outs = ort_session.run(None, ort_inputs)

    # Convert the output to a tensor
    # ort_outs = [torch.from_numpy(out).to(DEVICE) for out in ort_outs]
    ort_outs = [torch.Tensor(out).to(DEVICE) for out in ort_outs]
    return ort_outs


def compare_models(torch_model: PPNet, other_model: Callable[[torch.Tensor], list[torch.Tensor]]) -> bool:
    """Compares the output of the torch model with the other model.

    Args:
        torch_model: The torch model to compare.
        other_model: The other model to compare to.

    Returns:
        True if the outputs are equal, False otherwise.
    """
    # Create dummy input
    img_size = torch_model.img_size
    dummy = torch.randn(BATCH_SIZE, 3, img_size, img_size).to(DEVICE)

    # Run models
    with torch.no_grad():
        torch_outs = torch_model(dummy)
        other_outs = other_model(dummy)

    # Compare outputs
    try:
        assert len(torch_outs) == len(other_outs)
        # rtol=1e-03, atol=1e-05
        for torch_out, other_out in zip(torch_outs, other_outs):
            torch.testing.assert_close(torch_out, other_out)
    except AssertionError as e:
        print(e)
        return False
    return True


def benchmark_model(
    model: Callable[[torch.Tensor], list[torch.Tensor]],
    img_size: int,
    label: str = "Model",
) -> tuple[float, float]:
    """Benchmarks the given model.

    Args:
        model: The model to benchmark.

    Returns:
        The median time it took to run the model.
    """

    # Create dummy input
    def dummy_input():
        return torch.randn(BATCH_SIZE, 3, img_size, img_size).to(DEVICE)

    # Benchmark torch model
    t = benchmark.Timer(
        stmt="model(dummy_input())",
        globals={"model": model, "dummy_input": dummy_input},
        num_threads=1,
        label=label,
    ).blocked_autorange(min_run_time=1)
    return t.mean, t.median


def test(
    model: Callable[[torch.Tensor], list[torch.Tensor]],
    dataset_path: Path,
    img_size: int,
) -> tuple[float, float, float]:
    """Tests the given model.

    Args:
        model: The model to test.
        dataset_path: The path to the dataset to test on.

    Returns:
        The accuracy of the model.
    """
    # Make sure dataset path exists
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset path {dataset_path!r} does not exist!")

    # Create dataset
    dataset = ImageFolder(
        dataset_path,
        transform=transforms.Compose(
            [
                transforms.Resize((img_size, img_size)),
                transforms.ToTensor(),
                transforms.Normalize(MEAN, STD),
            ]
        ),
    )

    # Create data loader
    use_gpu = torch.cuda.is_available() and DEVICE != torch.device("cpu")
    data_loader = DataLoader(
        dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=4,
        pin_memory=use_gpu,
    )

    # Test model
    with torch.no_grad():
        t = 0
        total = len(data_loader)
        correct = 0

        for i, (images, labels) in enumerate(data_loader):
            # Move images and labels to the correct device
            images = images.to(DEVICE)
            labels = labels.to(DEVICE)

            # Run model
            t0 = time.time()
            outputs = model(images)
            t += time.time() - t0

            # Get predictions
            _, predicted = torch.max(outputs[0].data, 1)

            # Update accuracy
            # total += labels.size(0)
            correct += (predicted == labels).sum().item()

            # Every 25% show signs of progress
            if i % (total // 4) == 0:
                print(".", end="", flush=True)

    # Print newline
    print()

    return t, correct, total


if __name__ == "__main__":
    model_path = Path("model/100push0.7413.pth")
    model_info_path = Path("model/bb100.npy")
    onnx_path = Path("model/exported.onnx")
    torchscript_path = Path("model/exported.pt")
    dataset_path = Path("dataset")

    torch.manual_seed(0)

    torch_model = load_torch_model(model_path)
    print(torch_model)

    is_sane = sanity_check(torch_model, model_info_path)
    if not is_sane:
        print("Model is not sane!")
        exit(1)

    # Create dummy input
    batch_size = 1
    img_size = torch_model.img_size
    dummy = torch.randn(batch_size, 3, img_size, img_size).to(DEVICE)

    # Export to ONNX
    export_onnx(torch_model, onnx_path, dummy)
    is_onnx_valid = validate_onnx(onnx_path)
    onnx_model = load_onnx(onnx_path)

    def onnx_wrapper(x: torch.Tensor) -> list[torch.Tensor]:
        return run_onnx(onnx_model, x)

    is_onnx_equal = compare_models(torch_model, onnx_wrapper)

    # Export to TorchScript
    export_torchscript(torch_model, torchscript_path, dummy)
    torchscript_model = load_torchscript(torchscript_path)
    is_torchscript_equal = compare_models(torch_model, torchscript_model)

    # Benchmark models
    torch_mean, torch_median = benchmark_model(torch_model, img_size)
    onnx_mean, onnx_median = benchmark_model(onnx_wrapper, img_size)
    ts_mean, ts_median = benchmark_model(torchscript_model, img_size)

    # Test models
    torch_t, torch_correct, torch_total = test(torch_model, dataset_path, img_size)
    onnx_t, onnx_correct, onnx_total = test(onnx_wrapper, dataset_path, img_size)
    ts_t, ts_correct, ts_total = test(torchscript_model, dataset_path, img_size)

    # Print results
    print("PyTorch:")
    print(f"    Sane: {is_sane}")
    print("    Benchmark:")
    print(f"        Mean: {torch_mean:.4f}s")
    print(f"        Median: {torch_median:.4f}s")
    print("    Test:")
    print(f"        Time: {torch_t:.4f}s")
    print(f"        Accuracy (%): {torch_correct / torch_total * 100:.4f}%")
    print(f"        Accuracy (num): {torch_correct} / {torch_total}")
    print(f"        Images/s: {torch_total / torch_t:.2f}")
    print()

    print("ONNX:")
    print(f"    Valid: {is_onnx_valid}")
    print(f"    Equal: {is_onnx_equal}")
    print("    Benchmark:")
    print(f"        Mean: {onnx_mean:.4f}s")
    print(f"        Median: {onnx_median:.4f}s")
    print("    Test:")
    print(f"        Time: {onnx_t:.4f}s")
    print(f"        Accuracy (%): {onnx_correct / onnx_total * 100:.4f}%")
    print(f"        Accuracy (num): {onnx_correct} / {onnx_total}")
    print(f"        Images/s: {onnx_total / onnx_t:.2f}")
    print()

    print("TorchScript:")
    print(f"    Equal: {is_torchscript_equal}")
    print("    Benchmark:")
    print(f"        Mean: {ts_mean:.4f}s")
    print(f"        Median: {ts_median:.4f}s")
    print("    Test:")
    print(f"        Time: {ts_t:.4f}s")
    print(f"        Accuracy (%): {ts_correct / ts_total * 100:.4f}%")
    print(f"        Accuracy (num): {ts_correct} / {ts_total}")
    print(f"        Images/s: {ts_total / ts_t:.2f}")
    print()
