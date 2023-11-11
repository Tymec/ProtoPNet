from pathlib import Path

import onnx
import onnxruntime
import torch
from torch.autograd import Variable

from model import PPNet


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
    model: PPNet = torch.load(model_path).cpu()
    model.eval()

    return model


def export(model: PPNet, export_path: Path, verbose: bool = False) -> None:
    """Exports the model to ONNX format.

    Args:
        model: The model to export.
        export_path: Where to save the exported ONNX file.
    """
    # Make sure model is in evaluation mode
    if model.training:
        model.eval()

    # Create dummy input
    dummy = torch.randn(1, 3, model.img_size, model.img_size)

    # Export the model
    torch.onnx.export(
        model,
        dummy,
        export_path,
        export_params=True,
        input_names=["image"],
        output_names=["logits", "prototype_activations", "prototype_activation_patterns"],
        do_constant_folding=True,
        verbose=verbose,
    )

    return model


def validate(onnx_path: Path) -> bool:
    """Checks if the exported ONNX file is valid.

    Args:
        onnx_path: The path to the exported ONNX file.

    Returns:
        True if the file is valid, False otherwise.
    """
    # Make sure the file exists
    if not onnx_path.exists():
        raise FileNotFoundError(f"File {onnx_path!r} does not exist.")

    # Load the model
    model = onnx.load(onnx_path)

    # Check if the model is valid
    try:
        onnx.checker.check_model(model)
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
    # Create dummy input
    dummy = torch.randn(1, 3, model.img_size, model.img_size)
    dummy = Variable(dummy).cpu()

    # Run the model
    torch_out = model(dummy)

    # Load the ONNX model
    ort_session = onnxruntime.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])

    def to_numpy(ten: torch.Tensor) -> torch.Tensor:
        return ten.detach().cpu().numpy() if ten.requires_grad else ten.cpu().numpy()

    # Compute ONNX Runtime output prediction
    ort_inputs = {ort_session.get_inputs()[0].name: to_numpy(dummy)}
    ort_outs = ort_session.run(None, ort_inputs)

    # Compare ONNX Runtime and PyTorch results
    try:
        torch.testing.assert_close(to_numpy(torch_out[0]), ort_outs[0], rtol=1e-03, atol=1e-05)
    except AssertionError as e:
        print(e)
        return False
    return True


if __name__ == "__main__":
    model_path = Path("model/100push0.7413.pth")
    onnx_path = Path("model/exported.onnx")

    model = load_model(model_path)
    print(model)

    export(model, onnx_path)

    is_valid = validate(onnx_path)
    print(f"ONNX file is valid: {is_valid}")

    is_equal = compare(model, onnx_path)
    print(f"Outputs are equal: {is_equal}")
