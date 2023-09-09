
import { Routes, Route, HashRouter } from 'react-router-dom'
import Login from './Login'
import Dashboard from './Dashboard'

export default function App() {
  return (
    <HashRouter>
      <Routes>

        <Route
          path='/dashboard'
          element={<Dashboard />}
        />
        <Route
          path='/'
          element={<Login />}
        />


        <Route
          path=""
          element={<Login />}
        />

      </Routes>
    </HashRouter>
  )
}