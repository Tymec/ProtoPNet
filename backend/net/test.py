import time
from pathlib import Path

import torch
import torchvision.datasets as datasets
import torchvision.transforms as transforms
from inference_torch import MEAN, STD, load_model


def list_of_distances(X, Y):
    return torch.sum((torch.unsqueeze(X, dim=2) - torch.unsqueeze(Y.t(), dim=0)) ** 2, dim=1)


def test(model, dataloader, class_specific=False):
    start = time.time()
    n_examples = 0
    n_correct = 0
    n_batches = 0
    total_cross_entropy = 0
    total_cluster_cost = 0
    # separation cost is meaningful only for class_specific
    total_separation_cost = 0
    total_avg_separation_cost = 0

    for i, (image, label) in enumerate(dataloader):
        inp = image.cuda()
        target = label.cuda()

        with torch.no_grad():
            output, min_distances, acts, act_patterns = model(inp)

            # compare with acts and act_patterns
            _, distances = model.push_forward(inp)
            prototype_activations = model.distance_2_similarity(min_distances)
            prototype_activation_patterns = model.distance_2_similarity(distances)

            assert torch.allclose(acts, prototype_activations)
            assert torch.allclose(act_patterns, prototype_activation_patterns)

            # compute loss
            cross_entropy = torch.nn.functional.cross_entropy(output, target)

            if class_specific:
                max_dist = model.prototype_shape[1] * model.prototype_shape[2] * model.prototype_shape[3]

                # prototypes_of_correct_class is a tensor of shape batch_size * num_prototypes
                # calculate cluster cost
                prototypes_of_correct_class = torch.t(model.prototype_class_identity[:, label]).cuda()
                inverted_distances, _ = torch.max((max_dist - min_distances) * prototypes_of_correct_class, dim=1)
                cluster_cost = torch.mean(max_dist - inverted_distances)

                # calculate separation cost
                prototypes_of_wrong_class = 1 - prototypes_of_correct_class
                inverted_distances_to_nontarget_prototypes, _ = torch.max(
                    (max_dist - min_distances) * prototypes_of_wrong_class, dim=1
                )
                separation_cost = torch.mean(max_dist - inverted_distances_to_nontarget_prototypes)

                # calculate avg cluster cost
                avg_separation_cost = torch.sum(min_distances * prototypes_of_wrong_class, dim=1) / torch.sum(
                    prototypes_of_wrong_class, dim=1
                )
                avg_separation_cost = torch.mean(avg_separation_cost)
            else:
                min_distance, _ = torch.min(min_distances, dim=1)
                cluster_cost = torch.mean(min_distance)

            # evaluation statistics
            _, predicted = torch.max(output.data, 1)
            n_examples += target.size(0)
            n_correct += (predicted == target).sum().item()

            n_batches += 1
            total_cross_entropy += cross_entropy.item()
            total_cluster_cost += cluster_cost.item()
            if class_specific:
                total_separation_cost += separation_cost.item()
                total_avg_separation_cost += avg_separation_cost.item()

        del inp
        del target
        del output
        del predicted
        del min_distances

    end = time.time()

    print("time: \t\t{0}".format(end - start))
    print("cross ent: \t{0}".format(total_cross_entropy / n_batches))
    print("cluster: \t{0}".format(total_cluster_cost / n_batches))
    if class_specific:
        print("separation:\t{0}".format(total_separation_cost / n_batches))
        print("avg separation:\t{0}".format(total_avg_separation_cost / n_batches))
    print("accu: \t\t{0}%".format(n_correct / n_examples * 100))
    print("accu num: \t{0}/{1}".format(n_correct, n_examples))
    print("l1: \t\t{0}".format(model.last_layer.weight.norm(p=1).item()))
    p = model.prototype_vectors.view(model.num_prototypes, -1).cpu()
    with torch.no_grad():
        p_avg_pair_dist = torch.mean(list_of_distances(p, p))
    print("p dist pair: \t{0}".format(p_avg_pair_dist.item()))

    return n_correct / n_examples


if __name__ == "__main__":
    model_path = Path("model/100push0.7413.pth")
    test_dir = Path("dataset")
    batch_size = 32

    # load model
    model = load_model(model_path, 0)

    # prepare test data
    img_size = model.img_size
    test_dataset = datasets.ImageFolder(
        test_dir,
        transforms.Compose(
            [
                transforms.Resize(size=(img_size, img_size)),
                transforms.ToTensor(),
                transforms.Normalize(mean=MEAN, std=STD),
            ]
        ),
    )
    test_loader = torch.utils.data.DataLoader(
        test_dataset, batch_size=batch_size, shuffle=False, num_workers=4, pin_memory=False
    )

    # test
    test(model, test_loader)
