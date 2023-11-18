import time
import warnings
from collections.abc import Iterator
from pathlib import Path

import cv2
import numpy as np
import torch
from net.model import PPNet
from net.vgg_features import VGG_features
from PIL import Image

MEAN = (0.485, 0.456, 0.406)
STD = (0.229, 0.224, 0.225)
PERCENTILE = 95
CLASSIFICATIONS = [
    "Black-footed Albatross",
    "Laysan Albatross",
    "Sooty Albatross",
    "Groove-billed Ani",
    "Crested Auklet",
    "Least Auklet",
    "Parakeet Auklet",
    "Rhinoceros Auklet",
    "Brewer Blackbird",
    "Red-winged Blackbird",
    "Rusty Blackbird",
    "Yellow-headed Blackbird",
    "Bobolink",
    "Indigo Bunting",
    "Lazuli Bunting",
    "Painted Bunting",
    "Cardinal",
    "Spotted Catbird",
    "Gray Catbird",
    "Yellow-breasted Chat",
    "Eastern Towhee",
    "Chuck-will Widow",
    "Brandt Cormorant",
    "Red-faced Cormorant",
    "Pelagic Cormorant",
    "Bronzed Cowbird",
    "Shiny Cowbird",
    "Brown Creeper",
    "American Crow",
    "Fish Crow",
    "Black-billed Cuckoo",
    "Mangrove Cuckoo",
    "Yellow-billed Cuckoo",
    "Gray-crowned Rosy Finch",
    "Purple Finch",
    "Northern Flicker",
    "Acadian Flycatcher",
    "Great Crested Flycatcher",
    "Least Flycatcher",
    "Olive-sided Flycatcher",
    "Scissor-tailed Flycatcher",
    "Vermilion Flycatcher",
    "Yellow-bellied Flycatcher",
    "Frigatebird",
    "Northern Fulmar",
    "Gadwall",
    "American Goldfinch",
    "European Goldfinch",
    "Boat-tailed Grackle",
    "Eared Grebe",
    "Horned Grebe",
    "Pied-billed Grebe",
    "Western Grebe",
    "Blue Grosbeak",
    "Evening Grosbeak",
    "Pine Grosbeak",
    "Rose-breasted Grosbeak",
    "Pigeon Guillemot",
    "California Gull",
    "Glaucous-winged Gull",
    "Heermann Gull",
    "Herring Gull",
    "Ivory Gull",
    "Ring-billed Gull",
    "Slaty-backed Gull",
    "Western Gull",
    "Anna Hummingbird",
    "Ruby-throated Hummingbird",
    "Rufous Hummingbird",
    "Green Violetear",
    "Long-tailed Jaeger",
    "Pomarine Jaeger",
    "Blue Jay",
    "Florida Jay",
    "Green Jay",
    "Dark-eyed Junco",
    "Tropical Kingbird",
    "Gray Kingbird",
    "Belted Kingfisher",
    "Green Kingfisher",
    "Pied Kingfisher",
    "Ringed Kingfisher",
    "White-breasted Kingfisher",
    "Red-legged Kittiwake",
    "Horned Lark",
    "Pacific Loon",
    "Mallard",
    "Western Meadowlark",
    "Hooded Merganser",
    "Red-breasted Merganser",
    "Mockingbird",
    "Nighthawk",
    "Clark Nutcracker",
    "White-breasted Nuthatch",
    "Baltimore Oriole",
    "Hooded Oriole",
    "Orchard Oriole",
    "Scott Oriole",
    "Ovenbird",
    "Brown Pelican",
    "White Pelican",
    "Western-Wood Pewee",
    "Sayornis",
    "American Pipit",
    "Whip-poor Will",
    "Horned Puffin",
    "Common Raven",
    "White-necked Raven",
    "American Redstart",
    "Geococcyx",
    "Loggerhead Shrike",
    "Great Grey Shrike",
    "Baird Sparrow",
    "Black-throated Sparrow",
    "Brewer Sparrow",
    "Chipping Sparrow",
    "Clay-colored Sparrow",
    "House Sparrow",
    "Field Sparrow",
    "Fox Sparrow",
    "Grasshopper Sparrow",
    "Harris Sparrow",
    "Henslow Sparrow",
    "Le Conte Sparrow",
    "Lincoln Sparrow",
    "Nelson Sharp-tailed Sparrow",
    "Savannah Sparrow",
    "Seaside Sparrow",
    "Song Sparrow",
    "Tree Sparrow",
    "Vesper Sparrow",
    "White-crowned Sparrow",
    "White-throated Sparrow",
    "Cape Glossy Starling",
    "Bank Swallow",
    "Barn Swallow",
    "Cliff Swallow",
    "Tree Swallow",
    "Scarlet Tanager",
    "Summer Tanager",
    "Artic Tern",
    "Black Tern",
    "Caspian Tern",
    "Common Tern",
    "Elegant Tern",
    "Forsters Tern",
    "Least Tern",
    "Green-tailed Towhee",
    "Brown Thrasher",
    "Sage Thrasher",
    "Black-capped Vireo",
    "Blue-headed Vireo",
    "Philadelphia Vireo",
    "Red-eyed Vireo",
    "Warbling Vireo",
    "White-eyed Vireo",
    "Yellow-throated Vireo",
    "Bay-breasted Warbler",
    "Black-and-white Warbler",
    "Black-throated Blue Warbler",
    "Blue-winged Warbler",
    "Canada Warbler",
    "Cape May Warbler",
    "Cerulean Warbler",
    "Chestnut-sided Warbler",
    "Golden-winged Warbler",
    "Hooded Warbler",
    "Kentucky Warbler",
    "Magnolia Warbler",
    "Mourning Warbler",
    "Myrtle Warbler",
    "Nashville Warbler",
    "Orange-crowned Warbler",
    "Palm Warbler",
    "Pine Warbler",
    "Prairie Warbler",
    "Prothonotary Warbler",
    "Swainson Warbler",
    "Tennessee Warbler",
    "Wilson Warbler",
    "Worm-eating Warbler",
    "Yellow Warbler",
    "Northern Waterthrush",
    "Louisiana Waterthrush",
    "Bohemian Waxwing",
    "Cedar Waxwing",
    "American Three-toed Woodpecker",
    "Pileated Woodpecker",
    "Red-bellied Woodpecker",
    "Red-cockaded Woodpecker",
    "Red-headed Woodpecker",
    "Downy Woodpecker",
    "Bewick Wren",
    "Cactus Wren",
    "Carolina Wren",
    "House Wren",
    "Marsh Wren",
    "Rock Wren",
    "Winter Wren",
    "Common Yellowthroat",
]
DEVICE = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")


def load_model(state_path: Path, info_file: Path = None) -> PPNet:
    """
    Constructs a model from the given state file.

    Args:
        state_path: Path to the model state file.
        info_file: Path to the prototype info file.

    Returns:
        The loaded model.

    Raises:
        FileNotFoundError: If the model state or info file does not exist.
        RuntimeError: If the model does not behave as expected.
    """
    # Make sure model file exists
    if not state_path.exists():
        raise FileNotFoundError(f"Model {state_path!r} does not exist!")

    # Load state dict
    state_dict = torch.load(state_path, map_location=DEVICE)

    # Create features
    features = VGG_features(state_dict["features_cfg"]).to(DEVICE)
    features.load_state_dict(state_dict["features"])

    # Create model
    model = PPNet(
        features,
        state_dict["img_size"],
        state_dict["prototype_shape"],
        state_dict["proto_layer_rf_info"],
        state_dict["num_classes"],
        prototype_activation_function=state_dict["prototype_activation_function"],
        add_on_layers_type=state_dict["add_on_layers_type"],
    ).to(DEVICE)
    model.load_state_dict(state_dict["model"])
    model.eval()

    # If info file is not specified, warn user
    if info_file is None:
        warnings.warn("No info file specified! Skipping sanity check...")
        return model

    # Make sure model behaves as expected
    if not sanity_check(model, info_file):
        raise RuntimeError("Model did not pass the sanity check!")

    return model


def sanity_check(model: PPNet, info_file: Path) -> bool:
    """
    Checks if the given model behaves as expected.
    Should be called after loading the model.

    Args:
        model: Model to check.
        info_file: Path to the prototype info file.

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


def preprocess_image(image: Image.Image, size: int) -> Image.Image:
    """Preprocesses the given image.

    Args:
        image: The loaded image.
        size: Network input size.

    Returns:
        Tuple containing the preprocessed image and the original image.
    """
    # Make sure image is RGB
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Load and resize image
    img = np.array(image)
    res = np.array(Image.fromarray(img).resize((size, size), Image.BILINEAR))
    res = res.astype(np.float32) / 255.0
    orig = res.copy()

    # Normalize image
    mean = np.array(MEAN, dtype=np.float32).reshape((1, 1, 3))
    std = np.array(STD, dtype=np.float32).reshape((1, 1, 3))
    res = (res - mean) / std

    # Add batch dimension and transpose
    res = np.expand_dims(res, axis=0)
    res = np.transpose(res, (0, 3, 1, 2))

    return res, orig


def predict(
    model: PPNet, image: Image.Image
) -> tuple[
    int,
    np.ndarray[int, np.dtype[np.float32]],
    np.ndarray[int, np.dtype[np.float32]],
    np.ndarray[int, np.dtype[np.float32]],
]:
    """
    Predicts the class of the given image.

    Args:
        model: Model to use.
        image: Image to predict.

    Returns:
        Tuple of (prediction, activation, activation pattern, original image).
    """
    # Preprocess image
    img_size = model.img_size
    img, original_img = preprocess_image(image, img_size)

    # Pass image through model
    img_tensor = torch.from_numpy(img).to(DEVICE)
    logits, _, prototype_activations, prototype_activation_patterns = model(img_tensor)

    # Convert to numpy arrays
    prototype_activations = prototype_activations.cpu().detach().numpy()
    prototype_activation_patterns = prototype_activation_patterns.cpu().detach().numpy()

    # Return outputs
    return (
        torch.argmax(logits, dim=1)[0].item(),
        prototype_activations[0],
        prototype_activation_patterns[0],
        original_img,
    )


def top_k_prototype_generator(
    activation: np.ndarray,
    activation_pattern: np.ndarray,
    img_size: int,
    k: int = 10,
) -> Iterator[np.ndarray]:
    """Generator that yields upsampled activation patterns for the top-k prototypes.

    Args:
        activation: The prototype activations.
        activation_pattern: The prototype activation patterns.
        img_size: The size of the original image.
        k: The number of prototypes to use.

    Yields:
        Upsampled activation patterns.
    """

    # Sort activations along the last axis
    sorted_indices = np.argsort(activation)

    # Make sure k is within bounds
    if k > len(sorted_indices):
        k = len(sorted_indices)

    # Iterate over the k largest activations
    for i in range(1, k + 1):
        # Upsample activation pattern
        pattern = activation_pattern[sorted_indices[-i]]
        pattern = cv2.resize(pattern, dsize=(img_size, img_size), interpolation=cv2.INTER_CUBIC)
        yield pattern


def heatmap_by_top_k_prototype(
    activation: np.ndarray,
    activation_pattern: np.ndarray,
    original_img: np.ndarray,
    k: int = 10,
) -> list[Image.Image]:
    """Overlays the activation patterns for the top-k prototypes on the original image.

    Args:
        activation: The prototype activations.
        activation_pattern: The prototype activation patterns.
        original_img: The original image.
        k: The number of prototypes to use.

    Returns:
        List of images with overlayed activation patterns.
    """
    img_size = original_img.shape[0]
    images: list[Image.Image] = []
    for pattern in top_k_prototype_generator(activation, activation_pattern, img_size, k):
        # Rescale pattern
        pattern = (pattern - pattern.min()) / (pattern.max() - pattern.min())

        # Create heatmap
        pattern = np.uint8(255 * pattern)
        heatmap = cv2.applyColorMap(pattern, cv2.COLORMAP_JET)
        heatmap = np.float32(heatmap) / 255
        heatmap = heatmap[..., ::-1]

        # Overlay heatmap on original image
        overlayed_img = 0.5 * original_img + 0.3 * heatmap
        overlayed_img = np.uint8(255 * overlayed_img)

        # Convert to PIL image
        im = Image.fromarray(overlayed_img, "RGB")
        images.append(im)

    return images


def box_by_top_k_prototype(
    activation: np.ndarray,
    activation_pattern: np.ndarray,
    original_img: np.ndarray,
    k: int = 10,
) -> list[Image.Image]:
    """Draws bounding boxes around the activation patches for top-k prototypes.

    Args:
        activation: The prototype activations.
        activation_pattern: The prototype activation patterns.
        original_img: The original image.
        k: The number of prototypes to use.

    Returns:
        List of images with bounding boxes.
    """
    img_size = original_img.shape[0]
    images: list[Image.Image] = []
    for pattern in top_k_prototype_generator(activation, activation_pattern, img_size, k):
        # Find indices of the bounding box
        threshold = np.percentile(pattern, PERCENTILE)
        mask = np.ones(pattern.shape)
        mask[pattern < threshold] = 0
        indices = np.where(mask == 1)

        # Calculate bounding box
        x_min = np.min(indices[0])
        x_max = np.max(indices[0])
        y_min = np.min(indices[1])
        y_max = np.max(indices[1])

        # Draw bounding box
        img = np.uint8(255 * original_img)
        img = cv2.rectangle(
            img,
            (y_min, x_min),
            (y_max, x_max),
            color=(255, 255, 0),
            thickness=2,
        )

        # Convert to PIL image
        im = Image.fromarray(img, "RGB")
        images.append(im)

    return images


def get_classification(idx: int) -> str:
    """
    Gets the classification of the given index.

    Args:
        idx: Index of the classification.

    Returns:
        Classification of the given index.
    """
    return CLASSIFICATIONS[idx]


if __name__ == "__main__":
    img_path = Path("static/Great_Crested_Flycatcher_0051_29530.jpg")
    model_state_path = Path("model/100push0.7413.state.pth")
    info_path = Path("model/bb100.npy")
    heatmaps_dir = Path("static/heatmap")
    boxes_dir = Path("static/boxmap")

    # Load model
    ppnet = load_model(model_state_path, info_path)

    # Make sure image exists
    if not img_path.exists():
        raise FileNotFoundError(f"Image {img_path!r} does not exist!")

    # Warmup
    print("Warming up...")
    r = 100
    for test_img_path in Path("static/dataset/").glob("**/*.jpg"):
        if r == 0:
            break
        predict(ppnet, Image.open(test_img_path))
        r -= 1

    # Predict image
    start_t = time.time()
    pred, act, pat, img = predict(ppnet, Image.open(img_path))
    print(f"Time: {time.time() - start_t:.4f}s")
    print(f"Prediction: {get_classification(pred)} ({pred})")

    # Save heatmaps
    heatmaps_dir.mkdir(parents=True, exist_ok=True)
    heatmaps = heatmap_by_top_k_prototype(act, pat, img, 1)
    for i, im in enumerate(heatmaps):
        im.save(heatmaps_dir / f"heat_{i}.jpg")
        continue

    # Save boxes
    boxes_dir.mkdir(parents=True, exist_ok=True)
    boxes = box_by_top_k_prototype(act, pat, img, 1)
    for i, im in enumerate(boxes):
        im.save(boxes_dir / f"box_{i}.jpg")
        continue
