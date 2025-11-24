import { useState } from 'react';
import axios from 'axios';
import './index.css';

const API_URL = "https://zona-medicamentos-scraper-back-production.up.railway.app/";

interface Producto {
  Producto: string;
  Precio_Oferta: string;
  Precio_Regular: string;
  Imagen_URL: string;
  Enlace: string;
  Farmacia: string;
}

function App() {
  const [keyword, setKeyword] = useState('jabon');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); 
  
  const [nameFilter, setNameFilter] = useState("");
  const [pharmacyFilter, setPharmacyFilter] = useState("");
  // Usamos 300 como valor máximo predeterminado.
  const [priceFilter, setPriceFilter] = useState(300); 
  const [offersFilter, setOffersFilter] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    
    if (!keyword.trim()) {
      alert("Por favor, ingresa un término de búsqueda.");
      return;
    }

    setIsLoading(true);
    setProductos([]); 
    setError(null); // Resetea el error

    try {
      // Utilizamos 'jabon' solo para la primera carga si no se ha buscado nada
      const searchKeyword = keyword.trim() || 'jabon'; 
      const urlCompleta = `${API_URL}/buscar_productos?keyword=${encodeURIComponent(searchKeyword)}`;

      // 300000 ms = 5 minutos de timeout
      const response = await axios.get(urlCompleta, {
        timeout: 300000 
      });

      // Asegúrate de que response.data.data sea un array, o usa un fallback.
      setProductos(response.data.data || []); 
      setIsLoading(false);

    } catch (err: any) { 
      console.error("Error al buscar:", err);
      if (err.code === 'ECONNABORTED') {
        setError("La búsqueda tardó demasiado y fue cancelada (Timeout). Intenta de nuevo."); 
      } else if (err.response) {
        setError(`Error del servidor (${err.response.status}). Intenta de nuevo más tarde.`);
      } else {
        setError("No se pudo conectar al backend. El servicio puede estar inactivo o tardando mucho."); 
      }
      setIsLoading(false);
    }
  }
  
  const getFilteredProducts = () => {
    return productos.filter(product => { 
      
      // Intentamos obtener el precio de oferta, si falla es 0
      const priceMatch = product.Precio_Oferta.match(/\d+(\.\d+)?/);
      const price = priceMatch ? parseFloat(priceMatch[0]) : 0;
      
      const hasOffer = product.Precio_Regular !== "No disponible";

      // Filtro por nombre
      if (nameFilter && !product.Producto.toLowerCase().includes(nameFilter.toLowerCase())) {
        return false;
      }
      // Filtro por farmacia
      if (pharmacyFilter && product.Farmacia !== pharmacyFilter) {
        return false;
      }
      // Filtro por precio máximo
      if (price > priceFilter) {
        return false;
      }
      // Filtro por ofertas
      if (offersFilter && !hasOffer) {
        return false;
      }
      return true;
    })
    // Ordenar por precio de oferta ascendente
    .sort((a, b) => {
      const priceA = parseFloat(a.Precio_Oferta.replace(/S\/\s*/, '')) || 0;
      const priceB = parseFloat(b.Precio_Oferta.replace(/S\/\s*/, '')) || 0;
      return priceA - priceB;
    });
  }
  
  const filteredProducts = getFilteredProducts();

  return (
    <div className="App">
      <header className="header">
        <h1>💊 FarmaCompara</h1>
        <p>Compara precios en las mejores farmacias del Perú</p>
      </header>

      <main className="container">
        <section className="search-card">
          <h2>🔍 Buscar Productos</h2>
          <form onSubmit={handleSubmit}>
            <div className="search-input-group">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Ej: paracetamol, protector solar..."
              />
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Buscando..." : "🔍 Buscar"}
              </button>
            </div>
          </form>

          {/* --- FILTROS --- */}
          <div className="filters-grid">
             <div className="filter-group">
              <label>Nombre contiene:</label>
              <input 
                type="text" 
                placeholder="Ej: Nivea, Dove..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Farmacia:</label>
              <select value={pharmacyFilter} onChange={(e) => setPharmacyFilter(e.target.value)}>
                <option value="">Todas</option>
                <option value="Inkafarma">Inkafarma</option>
                <option value="Mifarma">Mifarma</option>
                <option value="BoticasPeru">BoticasPeru</option>
                <option value="Boticas y Salud">Boticas y Salud</option>
                <option value="Farmacia Universal">Farmacia Universal</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Precio máximo (S/):</label>
              <div className="price-input-group">
                <input 
                  type="range" 
                  min="0" 
                  max="300" 
                  step="5"
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(Number(e.target.value))} 
                />
                <span className="price-value">S/ {priceFilter}</span>
              </div>
            </div>
            <div className="filter-group checkbox-group">
              <label>
                <input 
                  type="checkbox"
                  checked={offersFilter}
                  onChange={(e) => setOffersFilter(e.target.checked)}
                />
                <span>Solo ofertas</span>
              </label>
            </div>
          </div>
        </section>

        {/* --- RESULTADOS --- */}
        <section className="results-section">
          {isLoading && (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Buscando productos... (Esto puede tardar varios minutos)</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>❌ {error}</p>
            </div>
          )}
          
          {!isLoading && !error && (
            <div className="results-container">
              <div className="results-header">
                <h2>📦 Resultados</h2>
                <p>{filteredProducts.length} productos encontrados</p>
              </div>
              
              {filteredProducts.length === 0 && productos.length > 0 && (
                <p>No se encontraron productos con esos filtros. Intenta modificar la palabra clave o los filtros.</p>
              )}
              {productos.length === 0 && !keyword.trim() && (
                <p>Ingresa un término de búsqueda en el campo de arriba para empezar a comparar precios.</p>
              )}

              <div className="products-grid">
                {filteredProducts.map((product) => ( 
                  <div key={product.Enlace} className="product-card">
                    <div className="product-image">
                      <img 
                        src={product.Imagen_URL} 
                        alt={product.Producto} 
                        onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Imagen'}
                      />
                    </div>
                    <div className="product-content">
                      <span className="product-pharmacy">{product.Farmacia}</span>
                      <h3 className="product-name">{product.Producto}</h3>
                      <div className="product-prices">
                        <div className="price-offer">{product.Precio_Oferta}</div>
                        {product.Precio_Regular !== "No disponible" && (
                          <div className="price-regular">{product.Precio_Regular}</div>
                        )}
                      </div>
                      <a href={product.Enlace} target="_blank" rel="noopener noreferrer" className="product-link">
                        Ver en tienda →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}

export default App;