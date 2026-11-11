export const ORDER_URL =
  'https://vk.ru/market/product/ikona-svyatogo-nikolaya-35-sm-kh-25-sm-230757817-13999896'

export function asset(path) {
  return `${import.meta.env.BASE_URL}${String(path).replace(/^\//, '')}`
}

export const ATTRACT_VIDEO = asset('dom_v_dereve.mp4')

export const products = [
  {
    id: 'icon',
    title: 'Икона святителя Николая',
    detail: 'Деревянный рельеф, 35 × 25 см',
    model: asset('models/Icon.glb'),
    coverIndex: 0,
    images: [
      {
        src: asset('images/icon.jpg'),
        alt: 'Резная икона святителя Николая',
        position: 'center',
      },
    ],
  },
  {
    id: 'emblem',
    title: 'Резной герб',
    detail: 'Деревянное панно',
    model: asset('models/Emblem.glb'),
    coverIndex: 0,
    images: [
      {
        src: asset('images/emblem.jpg'),
        alt: 'Резной деревянный герб',
        position: 'center',
      },
    ],
  },
  {
    id: 'portrait',
    title: 'Портрет питомца',
    detail: 'Рельеф по вашей фотографии',
    model: asset('models/Portret.glb'),
    coverIndex: 1,
    images: [
      {
        src: asset('images/belka-photo.jpg'),
        alt: 'Фотография Белки',
        position: 'center 30%',
      },
      {
        src: asset('images/belka-carve.jpg'),
        alt: 'Резной портрет Белки',
        position: 'center',
      },
      {
        src: asset('images/ermak-photo.jpg'),
        alt: 'Фотография Ермака',
        position: 'center 40%',
      },
      {
        src: asset('images/ermak-carve.jpg'),
        alt: 'Резной портрет Ермака',
        position: 'center',
      },
    ],
    pairs: [
      {
        name: 'Белка',
        before: asset('images/belka-photo.jpg'),
        after: asset('images/belka-carve.jpg'),
        beforePosition: 'center 30%',
        afterPosition: 'center 42%',
        afterScale: 1.78,
        afterOrigin: '50% 40%',
      },
      {
        name: 'Ермак',
        before: asset('images/ermak-photo.jpg'),
        after: asset('images/ermak-carve.jpg'),
        beforePosition: 'center 40%',
        afterPosition: 'center',
      },
    ],
  },
]
