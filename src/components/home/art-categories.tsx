import { ArrowRight, Monitor, Palette } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";

const artCategories = [
  {
    id: 1,
    name: "Paintings",
    description: "Explore our collection of stunning paintings",
    icon: <Palette className="mb-4 h-8 w-8 text-primary" />,
    count: 156,
  },
  {
    id: 2,
    name: "Sculptures",
    description: "Discover our diverse range of sculptures",
    icon: <Palette className="mb-4 h-8 w-8 text-primary" />,
    count: 89,
  },
  {
    id: 3,
    name: "Other",
    description: "Experience the true form of artist's imagination",
    icon: <Monitor className="mb-4 h-8 w-8 text-primary" />,
    count: 124,
  },
];

export default function ArtCategories() {
return(
  <section className="bg-gray-50 py-20">
    <div className="container mx-auto px-4">
      <h2 className="mb-12 text-center text-3xl font-bold">
        Explore Art Categories
      </h2>
      <div className="grid gap-8 md:grid-cols-3">
        {artCategories.map((category) => (
          <Card
            key={category.id}
            className="group cursor-pointer transition-all duration-300 hover:shadow-lg"
          >
            <CardContent className="p-6 text-center">
              {category.icon}
              <h3 className="mb-2 text-xl font-bold">{category.name}</h3>
              <p className="mb-4 text-gray-600">{category.description}</p>
              <p className="mb-4 text-sm text-gray-500">
                {category.count} pieces
              </p>
              <Button
                variant="outline"
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                Browse Collection
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
)
}