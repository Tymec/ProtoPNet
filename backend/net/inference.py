import copy
from pathlib import Path
from types import SimpleNamespace

import cv2
import numpy as np
import torch
import torchvision.transforms as transforms
from matplotlib import pyplot as plt
from model import PPNet
from PIL import Image
from preprocess import mean, std, undo_preprocess_input_function
from torch.autograd import Variable

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


def find_high_activation_crop(activation_map, percentile=95):
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


def predict(ppnet: PPNet, image_file: Path, gpu: int) -> SimpleNamespace:
    """
    Predicts the class of the given image.

    Args:
        ppnet: Model to use.
        image_file: Path to the image file.
        gpu: GPU to use. If negative, use CPU.

    Returns:
        Namespace with the following attributes:
            prediction: Index of the predicted class.
            activation: Activation of the prototypes.
            pattern: Activation pattern of the prototypes.
            img: Original image.
    """
    # Make sure image file exists
    if not image_file.exists():
        raise FileNotFoundError(f"Image {image_file!r} does not exist!")

    # Parallelize the model
    ppnet_multi = torch.nn.DataParallel(ppnet)

    # Get model parameters
    img_size = ppnet_multi.module.img_size
    prototype_shape = ppnet.prototype_shape
    max_dist = prototype_shape[1] * prototype_shape[2] * prototype_shape[3]

    # Initialize transforms
    pre = transforms.Compose(
        [
            transforms.Resize((img_size, img_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=mean, std=std),
        ]
    )

    # Load and transform image
    image = Image.open(image_file)
    image_variable = Variable(pre(image).unsqueeze(0))
    image_tensor = image_variable.cuda(gpu) if gpu >= 0 else image_variable.cpu()

    # Pass image through network
    logits, min_distances = ppnet_multi(image_tensor)
    conv_output, distances = ppnet.push_forward(image_tensor)
    prototype_activations = ppnet.distance_2_similarity(min_distances)
    prototype_activation_patterns = ppnet.distance_2_similarity(distances)
    if ppnet.prototype_activation_function == "linear":
        prototype_activations = prototype_activations + max_dist
        prototype_activation_patterns = prototype_activation_patterns + max_dist

    img_copy = copy.deepcopy(image_tensor)
    original_img = undo_preprocess_input_function(img_copy[0:1])[0]
    original_img = original_img.detach().cpu().numpy()
    original_img = np.transpose(original_img, [1, 2, 0])

    return SimpleNamespace(
        prediction=torch.argmax(logits, dim=1)[0].item(),
        activation=prototype_activations[0],
        pattern=prototype_activation_patterns[0],
        img=original_img,
    )


def heatmap_by_top_k_prototype(
    activation: torch.Tensor,
    activation_pattern: torch.Tensor,
    original_img: np.ndarray,
    k: int = 10,
) -> list[np.ndarray]:
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

    activation_maps: list[np.ndarray] = []
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
        activation_maps.append(overlayed_img)

    return activation_maps


def box_by_top_k_prototype(
    activation: torch.Tensor,
    activation_pattern: torch.Tensor,
    original_img: np.ndarray,
    k: int = 10,
) -> list[np.ndarray]:
    # Sort activations
    array_act, sorted_indices_act = torch.sort(activation)

    # Get image size
    img_size = original_img.shape[0]

    # Make sure k is within bounds
    if k > len(array_act):
        k = len(array_act)

    activation_maps: list[np.ndarray] = []
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
        img_rgb_float = np.float32(img_rgb_uint8) / 255
        activation_maps.append(img_rgb_float)

    return activation_maps


if __name__ == "__main__":
    img_path = Path("static/Black_Footed_Albatross_0001_796111.jpg")
    model_path = Path("model/100push0.7413.pth")
    info_path = Path("model/bb100.npy")

    ppnet = load_model(model_path, 0)

    if not sanity_check(ppnet, info_path):
        raise RuntimeError("Model did not pass the sanity check!")

    proto = predict(ppnet, img_path, 0)
    print(f"Prediction: {CLASSIFICATIONS[proto.prediction]} ({proto.prediction})")

    heatmaps = heatmap_by_top_k_prototype(proto.activation, proto.pattern, proto.img, 10)
    for i, img in enumerate(heatmaps):
        plt.imsave(f"static/actual/heat_{i}.jpg", img)

    boxes = box_by_top_k_prototype(proto.activation, proto.pattern, proto.img, 10)
    for i, img in enumerate(boxes):
        plt.imsave(f"static/actual/box_{i}.jpg", img)
