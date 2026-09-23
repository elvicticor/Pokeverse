import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './styles.css'

// Los datos de Pokémon casi no cambian: se consideran frescos 1 h y no se recargan al volver a la pestaña.
// Un 404 (Pokémon inexistente) no se reintenta, para mostrar el error enseguida.
const queryClient = new QueryClient({
  defaultOptions: { queries: {
    staleTime: 60 * 60 * 1000, refetchOnWindowFocus: false,
    retry: (count, error) => !String(error).includes('HTTP 404') && count < 2,
  } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter><App /></BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
