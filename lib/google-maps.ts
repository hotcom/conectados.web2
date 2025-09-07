"use client"

import { Loader } from "@googlemaps/js-api-loader"

let loaderPromise: Promise<any> | null = null

export async function loadGoogleMaps(): Promise<any> {
  if (!loaderPromise) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      throw new Error("Defina NEXT_PUBLIC_GOOGLE_MAPS_API_KEY para usar o Google Places Autocomplete.")
    }
    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places"],
    })
    loaderPromise = loader.load()
  }
  return loaderPromise
}
