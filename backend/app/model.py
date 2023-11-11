from collections.abc import Iterator
from pathlib import Path

import cv2
import numpy as np
from onnxruntime import InferenceSession
from PIL import Image

MEAN = (0.485, 0.456, 0.406)
STD = (0.229, 0.224, 0.225)
PERCENTILE = 95
CLASSIFICATIONS = [
    "Black_footed_Albatross",
    "Laysan_Albatross",
    "Sooty_Albatross",
    "Groove_billed_Ani",
    "Crested_Auklet",
    "Least_Auklet",
    "Parakeet_Auklet",
    "Rhinoceros_Auklet",
    "Brewer_Blackbird",
    "Red_winged_Blackbird",
    "Rusty_Blackbird",
    "Yellow_headed_Blackbird",
    "Bobolink",
    "Indigo_Bunting",
    "Lazuli_Bunting",
    "Painted_Bunting",
    "Cardinal",
    "Spotted_Catbird",
    "Gray_Catbird",
    "Yellow_breasted_Chat",
    "Eastern_Towhee",
    "Chuck_will_Widow",
    "Brandt_Cormorant",
    "Red_faced_Cormorant",
    "Pelagic_Cormorant",
    "Bronzed_Cowbird",
    "Shiny_Cowbird",
    "Brown_Creeper",
    "American_Crow",
    "Fish_Crow",
    "Black_billed_Cuckoo",
    "Mangrove_Cuckoo",
    "Yellow_billed_Cuckoo",
    "Gray_crowned_Rosy_Finch",
    "Purple_Finch",
    "Northern_Flicker",
    "Acadian_Flycatcher",
    "Great_Crested_Flycatcher",
    "Least_Flycatcher",
    "Olive_sided_Flycatcher",
    "Scissor_tailed_Flycatcher",
    "Vermilion_Flycatcher",
    "Yellow_bellied_Flycatcher",
    "Frigatebird",
    "Northern_Fulmar",
    "Gadwall",
    "American_Goldfinch",
    "European_Goldfinch",
    "Boat_tailed_Grackle",
    "Eared_Grebe",
    "Horned_Grebe",
    "Pied_billed_Grebe",
    "Western_Grebe",
    "Blue_Grosbeak",
    "Evening_Grosbeak",
    "Pine_Grosbeak",
    "Rose_breasted_Grosbeak",
    "Pigeon_Guillemot",
    "California_Gull",
    "Glaucous_winged_Gull",
    "Heermann_Gull",
    "Herring_Gull",
    "Ivory_Gull",
    "Ring_billed_Gull",
    "Slaty_backed_Gull",
    "Western_Gull",
    "Anna_Hummingbird",
    "Ruby_throated_Hummingbird",
    "Rufous_Hummingbird",
    "Green_Violetear",
    "Long_tailed_Jaeger",
    "Pomarine_Jaeger",
    "Blue_Jay",
    "Florida_Jay",
    "Green_Jay",
    "Dark_eyed_Junco",
    "Tropical_Kingbird",
    "Gray_Kingbird",
    "Belted_Kingfisher",
    "Green_Kingfisher",
    "Pied_Kingfisher",
    "Ringed_Kingfisher",
    "White_breasted_Kingfisher",
    "Red_legged_Kittiwake",
    "Horned_Lark",
    "Pacific_Loon",
    "Mallard",
    "Western_Meadowlark",
    "Hooded_Merganser",
    "Red_breasted_Merganser",
    "Mockingbird",
    "Nighthawk",
    "Clark_Nutcracker",
    "White_breasted_Nuthatch",
    "Baltimore_Oriole",
    "Hooded_Oriole",
    "Orchard_Oriole",
    "Scott_Oriole",
    "Ovenbird",
    "Brown_Pelican",
    "White_Pelican",
    "Western_Wood_Pewee",
    "Sayornis",
    "American_Pipit",
    "Whip_poor_Will",
    "Horned_Puffin",
    "Common_Raven",
    "White_necked_Raven",
    "American_Redstart",
    "Geococcyx",
    "Loggerhead_Shrike",
    "Great_Grey_Shrike",
    "Baird_Sparrow",
    "Black_throated_Sparrow",
    "Brewer_Sparrow",
    "Chipping_Sparrow",
    "Clay_colored_Sparrow",
    "House_Sparrow",
    "Field_Sparrow",
    "Fox_Sparrow",
    "Grasshopper_Sparrow",
    "Harris_Sparrow",
    "Henslow_Sparrow",
    "Le_Conte_Sparrow",
    "Lincoln_Sparrow",
    "Nelson_Sharp_tailed_Sparrow",
    "Savannah_Sparrow",
    "Seaside_Sparrow",
    "Song_Sparrow",
    "Tree_Sparrow",
    "Vesper_Sparrow",
    "White_crowned_Sparrow",
    "White_throated_Sparrow",
    "Cape_Glossy_Starling",
    "Bank_Swallow",
    "Barn_Swallow",
    "Cliff_Swallow",
    "Tree_Swallow",
    "Scarlet_Tanager",
    "Summer_Tanager",
    "Artic_Tern",
    "Black_Tern",
    "Caspian_Tern",
    "Common_Tern",
    "Elegant_Tern",
    "Forsters_Tern",
    "Least_Tern",
    "Green_tailed_Towhee",
    "Brown_Thrasher",
    "Sage_Thrasher",
    "Black_capped_Vireo",
    "Blue_headed_Vireo",
    "Philadelphia_Vireo",
    "Red_eyed_Vireo",
    "Warbling_Vireo",
    "White_eyed_Vireo",
    "Yellow_throated_Vireo",
    "Bay_breasted_Warbler",
    "Black_and_white_Warbler",
    "Black_throated_Blue_Warbler",
    "Blue_winged_Warbler",
    "Canada_Warbler",
    "Cape_May_Warbler",
    "Cerulean_Warbler",
    "Chestnut_sided_Warbler",
    "Golden_winged_Warbler",
    "Hooded_Warbler",
    "Kentucky_Warbler",
    "Magnolia_Warbler",
    "Mourning_Warbler",
    "Myrtle_Warbler",
    "Nashville_Warbler",
    "Orange_crowned_Warbler",
    "Palm_Warbler",
    "Pine_Warbler",
    "Prairie_Warbler",
    "Prothonotary_Warbler",
    "Swainson_Warbler",
    "Tennessee_Warbler",
    "Wilson_Warbler",
    "Worm_eating_Warbler",
    "Yellow_Warbler",
    "Northern_Waterthrush",
    "Louisiana_Waterthrush",
    "Bohemian_Waxwing",
    "Cedar_Waxwing",
    "American_Three_toed_Woodpecker",
    "Pileated_Woodpecker",
    "Red_bellied_Woodpecker",
    "Red_cockaded_Woodpecker",
    "Red_headed_Woodpecker",
    "Downy_Woodpecker",
    "Bewick_Wren",
    "Cactus_Wren",
    "Carolina_Wren",
    "House_Wren",
    "Marsh_Wren",
    "Rock_Wren",
    "Winter_Wren",
    "Common_Yellowthroat",
]


def load_model(model_path: Path) -> InferenceSession:
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
    ort_session = InferenceSession(
        model_path,
        providers=["CPUExecutionProvider"],
    )

    return ort_session


def load_image(image_path: Path, size: int) -> tuple[np.ndarray, np.ndarray]:
    """Loads and preprocesses the image from the given path.

    Args:
        image_path: Path to the image file.
        size: Network input size.

    Returns:
        Tuple containing the preprocessed image and the original image.
    """
    # Make sure image file exists
    if not image_path.exists():
        raise FileNotFoundError(f"Image {image_path!r} does not exist!")

    # Load and resize image
    img = Image.open(image_path)
    img = np.array(img)
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


def predict(model: InferenceSession, image: np.ndarray) -> tuple[int, np.ndarray, np.ndarray]:
    """Predicts the class of the given image.

    Args:
        model: The model to use for prediction.
        image: The image to predict.

    Returns:
        Tuple containing the predicted class, the prototype activations and the prototype
        activation patterns.
    """
    # Pass image through model
    ort_inputs = {model.get_inputs()[0].name: image}
    ort_outs = model.run(None, ort_inputs)

    # Return output
    logits, prototype_activations, prototype_activation_patterns = ort_outs
    return (
        np.argmax(logits, axis=1)[0],
        prototype_activations[0],
        prototype_activation_patterns[0],
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


if __name__ == "__main__":
    # img_path = Path("static/001_Black_Footed_Albatross.jpg")
    # img_path = Path("static/086_Pacific_Loon.jpg")
    img_path = Path("static/007_Parakeet_Auklet.jpg")

    model_path = Path("model/exported.onnx")

    model = load_model(model_path)
    input_size = model.get_inputs()[0].shape  # batch, channels, height, width
    image, original_image = load_image(img_path, input_size[2])
    prediction, activation, activation_pattern = predict(model, image)

    predicted_class = CLASSIFICATIONS[prediction]
    print(f"Prediction: {predicted_class} ({prediction + 1})")

    heatmaps = heatmap_by_top_k_prototype(activation, activation_pattern, original_image)
    for i, heatmap in enumerate(heatmaps):
        heatmap.save(f"static/onnx/heatmap_{i}.jpg")

    boxes = box_by_top_k_prototype(activation, activation_pattern, original_image)
    for i, box in enumerate(boxes):
        box.save(f"static/onnx/box_{i}.jpg")
