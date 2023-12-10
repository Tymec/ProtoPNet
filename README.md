# ProtoPNet
ProtoPNet is a website that allows users to upload images of birds and get predictions of their species using a deep learning model called [ProtoPNet](https://github.com/cfchen-duke/ProtoPNet).

![Demo](/assets/demo.gif)

## Features
- Upload your own bird images and get the top 5 predictions of the bird's species
- Along with the predictions, you can see which parts of the image affected the model's decision the most in form of a heatmap
- See to what countries the bird is native to on a map (either a globe or a flat map)

## How to use
Either visit the [demo](https://proto-p-net.vercel.app/) or follow the installation instructions below to run the website locally.

## Requirements
- [Python 3.11](https://www.python.org/downloads/)
- [Node.js v19](https://nodejs.org/en/)
- [Make](https://www.gnu.org/software/make/)
- [pipenv](https://pipenv.pypa.io/en/latest/)
- [pnpm](https://pnpm.io/)

## Installation
1. Clone the repo: `git clone <repo_url>`
2. Change directory: `cd ProtoPNet`
3. Install dependencies: `make install`

### Backend
1. Modify `.env.example` and rename it to `.env`
2. `make backend` to start the backend server

### Frontend
1. `make frontend` to start the frontend server

## License
Distributed under the MIT License. See [LICENSE](/LICENSE) for more information.
