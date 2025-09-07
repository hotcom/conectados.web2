import MapView from "@/components/map-view"
import AdminNav from "@/components/admin-nav"

export default function MapaPage() {
  return (
    <>
      <AdminNav currentPage="/mapa" />
      <main className="lg:ml-80 pt-14 min-h-screen">
        <MapView />
      </main>
    </>
  )
}
