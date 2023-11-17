import sys
from pathlib import Path

import cv2
import numpy as np
import torch
import torchvision.transforms as transforms
from PIL import Image
from torch.autograd import Variable

from net.model import PPNet

sys.path.insert(0, "net/")

MEAN = (0.485, 0.456, 0.406)
STD = (0.229, 0.224, 0.225)
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


def get_device_id() -> int:
    """
    Gets the GPU/CPU to use.

    Returns:
        Positive for GPU, negative for CPU.
    """
    # Check if CUDA is available
    if torch.cuda.is_available():
        # Get number of GPUs
        num_gpus = torch.cuda.device_count()

        # Use all GPUs if available
        if num_gpus > 1:
            return -1

        # Use GPU 0 if available
        return 0

    # Use CPU if CUDA is not available
    return -1


def find_high_activation_crop(activation_map: torch.Tensor, percentile: int = 95) -> tuple[int, int, int, int]:
    """
    Finds the bounding box of the activation map.

    Args:
        activation_map: Activation map.
        percentile: Percentile to use as threshold.

    Returns:
        Tuple of (lower_y, upper_y, lower_x, upper_x).
    """
    threshold = np.percentile(activation_map, percentile)
    mask = np.ones(activation_map.shape)
    mask[activation_map < threshold] = 0
    lower_y, upper_y, lower_x, upper_x = 0, 0, 0, 0

    for i in range(mask.shape[0]):
        if np.amax(mask[i]) > 0.5:
            lower_y = i
            break

    for i in reversed(range(mask.shape[0])):
        if np.amax(mask[i]) > 0.5:
            upper_y = i
            break

    for j in range(mask.shape[1]):
        if np.amax(mask[:, j]) > 0.5:
            lower_x = j
            break

    for j in reversed(range(mask.shape[1])):
        if np.amax(mask[:, j]) > 0.5:
            upper_x = j
            break

    return lower_y, upper_y + 1, lower_x, upper_x + 1


def load_model(model_file: Path, gpu: int) -> PPNet:
    """
    Loads the model from the given file.

    Args:
        model_file: Path to the model file.
        gpu: GPU to use. If negative, use CPU.

    Returns:
        The loaded model.
    """
    # Make sure model file exists
    if not model_file.exists():
        raise FileNotFoundError(f"Model {model_file!r} does not exist!")

    # Set device
    if gpu < 0:
        device = torch.device("cpu")
    else:
        device = torch.device(f"cuda:{gpu}")

    # Load model
    ppnet: PPNet = torch.load(model_file, map_location=device)
    ppnet = ppnet.cuda(gpu) if gpu >= 0 else ppnet.cpu()

    return ppnet


def sanity_check(ppnet: PPNet, info_file: Path) -> bool:
    """
    Checks if the given model behaves as expected.
    Should be called after loading the model.

    Args:
        ppnet: Model to check.
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
    max_conn = torch.argmax(ppnet.last_layer.weight, dim=0)
    max_conn = max_conn.cpu().numpy()
    return np.sum(max_conn == identity) == ppnet.num_prototypes


def load_image(image_file: Path) -> Image.Image:
    """
    Loads the image from the given file.

    Args:
        image_file: Path to the image file.

    Returns:
        The loaded image.
    """
    # Make sure image file exists
    if not image_file.exists():
        raise FileNotFoundError(f"Image {image_file!r} does not exist!")

    # Load image
    image = Image.open(image_file)

    return image


def predict(
    ppnet: PPNet, image: Image.Image, gpu: int
) -> tuple[int, torch.Tensor, torch.Tensor, np.ndarray[int, np.dtype[np.float32]]]:
    """
    Predicts the class of the given image.

    Args:
        ppnet: Model to use.
        image: Image to predict.
        gpu: GPU to use. If negative, use CPU.

    Returns:
        Tuple of (prediction, activation, activation pattern, original image).
    """

    # Parallelize the model
    ppnet_multi = torch.nn.DataParallel(ppnet)

    # Get model parameters
    img_size = ppnet_multi.module.img_size
    prototype_shape = ppnet.prototype_shape
    max_dist = prototype_shape[1] * prototype_shape[2] * prototype_shape[3]

    # Initialize transforms
    resize = transforms.Resize((img_size, img_size))
    pre = transforms.Compose(
        [
            # transforms.Resize((img_size, img_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=MEAN, std=STD),
        ]
    )

    # Resize image
    resized_image: Image.Image = resize(image)

    # Save original image (scaled to [0, 1])
    original_img = np.array(resized_image.copy()).astype(np.float32) / 255

    # Normalize and prepare image
    image_variable = Variable(pre(resized_image).unsqueeze(0))
    image_tensor = image_variable.cuda(gpu) if gpu >= 0 else image_variable.cpu()

    # Pass image through network
    logits, min_distances = ppnet_multi(image_tensor)
    conv_output, distances = ppnet.push_forward(image_tensor)
    prototype_activations = ppnet.distance_2_similarity(min_distances)
    prototype_activation_patterns = ppnet.distance_2_similarity(distances)
    if ppnet.prototype_activation_function == "linear":
        prototype_activations = prototype_activations + max_dist
        prototype_activation_patterns = prototype_activation_patterns + max_dist

    prediction = torch.argmax(logits, dim=1)[0].item()
    activation = prototype_activations[0]
    pattern = prototype_activation_patterns[0]

    return prediction, activation, pattern, original_img


def heatmap_by_top_k_prototype(
    activation: torch.Tensor,
    activation_pattern: torch.Tensor,
    original_img: np.ndarray[int, np.dtype[np.float32]],
    k: int = 10,
) -> list[Image.Image]:
    """
    Overlays heatmaps of the top k prototypes on the original image.

    Args:
        activation: Activation of the prototypes.
        activation_pattern: Activation pattern of the prototypes.
        original_img: Original image.
        k: Number of prototypes to use.

    Returns:
        List of overlayed images.
    """
    # Sort activations
    array_act, sorted_indices_act = torch.sort(activation)

    # Get image size
    img_size = original_img.shape[0]

    # Make sure k is within bounds
    if k > len(array_act):
        k = len(array_act)

    images: list[Image.Image] = []
    for i in range(1, k + 1):
        # Get activation index
        act_index = sorted_indices_act[-i].item()

        # Upsample activation pattern
        act_pattern = activation_pattern[act_index].detach().cpu().numpy()
        upsampled_activation_pattern = cv2.resize(
            act_pattern, dsize=(img_size, img_size), interpolation=cv2.INTER_CUBIC
        )

        # Rescale activation pattern
        rescaled_activation_pattern = upsampled_activation_pattern - np.amin(upsampled_activation_pattern)
        rescaled_activation_pattern = rescaled_activation_pattern / np.amax(rescaled_activation_pattern)

        # Create heatmap
        heatmap = cv2.applyColorMap(np.uint8(255 * rescaled_activation_pattern), cv2.COLORMAP_JET)
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
    activation: torch.Tensor,
    activation_pattern: torch.Tensor,
    original_img: np.ndarray[int, np.dtype[np.float32]],
    k: int = 10,
) -> list[Image.Image]:
    """
    Draws bounding boxes around the top k prototypes on the original image.

    Args:
        activation: Activation of the prototypes.
        activation_pattern: Activation pattern of the prototypes.
        original_img: Original image.
        k: Number of prototypes to use.

    Returns:
        List of images with bounding boxes.
    """
    # Sort activations
    array_act, sorted_indices_act = torch.sort(activation)

    # Get image size
    img_size = original_img.shape[0]

    # Make sure k is within bounds
    if k > len(array_act):
        k = len(array_act)

    images: list[Image.Image] = []
    for i in range(1, k + 1):
        # Get activation index
        act_index = sorted_indices_act[-i].item()

        # Upsample activation pattern
        act_pattern = activation_pattern[act_index].detach().cpu().numpy()
        upsampled_activation_pattern = cv2.resize(
            act_pattern, dsize=(img_size, img_size), interpolation=cv2.INTER_CUBIC
        )

        # Get bounding box indices
        high_act_patch_indices = find_high_activation_crop(upsampled_activation_pattern)

        # Draw bounding box around activation patch on original image
        img_bgr_uint8 = cv2.cvtColor(np.uint8(255 * original_img), cv2.COLOR_RGB2BGR)
        cv2.rectangle(
            img_bgr_uint8,
            (high_act_patch_indices[2], high_act_patch_indices[0]),
            (high_act_patch_indices[3] - 1, high_act_patch_indices[1] - 1),
            color=(0, 255, 255),
            thickness=2,
        )
        img_rgb_uint8 = img_bgr_uint8[..., ::-1]

        # Convert to PIL image
        im = Image.fromarray(img_rgb_uint8, "RGB")
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
    img_path = Path("static/Black_Footed_Albatross_0001_796111.jpg")
    model_path = Path("model/100push0.7413.pth")
    info_path = Path("model/bb100.npy")

    device_id = get_device_id()
    ppnet = load_model(model_path, device_id)

    if not sanity_check(ppnet, info_path):
        raise RuntimeError("Model did not pass the sanity check!")

    image = load_image(img_path)
    pred, act, pat, img = predict(ppnet, image, device_id)
    print(f"Prediction: {get_classification(pred)} ({pred})")

    heatmaps = heatmap_by_top_k_prototype(act, pat, img, 10)
    for i, im in enumerate(heatmaps):
        im.save(f"static/actual/heat_{i}.jpg")
        continue

    boxes = box_by_top_k_prototype(act, pat, img, 10)
    for i, im in enumerate(boxes):
        im.save(f"static/actual/box_{i}.jpg")
        continue
