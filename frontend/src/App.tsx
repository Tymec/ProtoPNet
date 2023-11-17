import './App.css'
import ImageDropzone from './components/ImageDropzone'

enum ReturnType {
  BOTH = 'both',
  HEATMAPS = 'heatmaps',
  BOXES = 'boxes',
}

function predict(file: File, k: number = 10, returnType: ReturnType = ReturnType.BOTH) {
  console.log(file)

  const url =
    `${import.meta.env.API_URL}/predict` +
    new URLSearchParams({
      k: k.toString(),
      return_type: returnType,
    })

  fetch(url, {
    method: 'POST',
    body: file,
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data)
    })
    .catch((err) => {
      console.error(err)
    })
}

export default function App() {
  return (
    <div className="bg-gray-700 min-h-screen m-0 p-0">
      <ImageDropzone onUpload={predict} />
    </div>
  )
}
