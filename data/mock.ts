export type Flavor = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  price: number;
  color: string;
  image: string;
};

export type DeliveryPoint = {
  id: string;
  name: string;
  x: number;
  y: number;
  eta: number;
};

export const flavors: Flavor[] = [
  {
    id: "lucuma",
    name: "Lúcuma especial",
    subtitle: "Dulce, cremosa y de aquí",
    description: "La reina de la casa, hecha con lúcuma peruana.",
    price: 5,
    color: "#e8a24a",
    image: "/assets/ice-pops.jpg",
  },
  {
    id: "fresa",
    name: "Fresa rellena",
    subtitle: "Frutal con sorpresa",
    description: "Fresa cremosa con centro suave para antojarse.",
    price: 5,
    color: "#f472b6",
    image: "/assets/ice-pops.jpg",
  },
  {
    id: "mango",
    name: "Mango menta",
    subtitle: "Tropical y refrescante",
    description: "Mango maduro con un toque fresco de menta.",
    price: 4,
    color: "#f6c854",
    image: "/assets/assorted-pops.webp",
  },
  {
    id: "maracuya",
    name: "Maracuyá citrus",
    subtitle: "Ácido en su punto",
    description: "Maracuyá intenso para despertar el recreo.",
    price: 4,
    color: "#f5a444",
    image: "/assets/assorted-pops.webp",
  },
  {
    id: "coco",
    name: "Coco cremoso",
    subtitle: "Suave como una nube",
    description: "Coco cremosito, frío y artesanal.",
    price: 4,
    color: "#c5e8e8",
    image: "/assets/ice-pop-pair.png",
  },
];

export const deliveryPoints: DeliveryPoint[] = [
  { id: "fisi", name: "FISI", x: 27, y: 29, eta: 8 },
  { id: "economia", name: "Economía", x: 64, y: 24, eta: 10 },
  { id: "ciencias", name: "Ciencias", x: 73, y: 52, eta: 12 },
  { id: "medicina", name: "Medicina", x: 42, y: 45, eta: 9 },
  { id: "citfsn", name: "CITFSN", x: 25, y: 69, eta: 14 },
  { id: "agraria", name: "Agraria", x: 54, y: 76, eta: 15 },
  { id: "educacion", name: "Educación", x: 82, y: 77, eta: 11 },
];
