import MainBase from "./components/MainBase"
import FactionSelector from "./components/FactionSelector"

function App() {
  return (
    <div className="w-screen h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-4">
      <FactionSelector />
      <MainBase />
    </div>
  )
}

export default App
