import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  productName: string;
}

const ProductGalleryDialog = ({
  open,
  onOpenChange,
  images,
  productName,
}: ProductGalleryDialogProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  if (images.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-4xl w-full p-0 overflow-hidden bg-white">
        <div className="relative bg-white">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-[120] bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg hover:bg-gray-100 text-gray-700"
            aria-label="Fechar galeria"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="p-8">
            <h3 className="text-xl font-semibold mb-6 text-foreground">{productName}</h3>

            <Carousel setApi={setApi} className="w-full">
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                      <img
                        src={image}
                        alt={`${productName} - Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {images.length > 1 && (
                <>
                  <CarouselPrevious className="left-4 z-[110] bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg" />
                  <CarouselNext className="right-4 z-[110] bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg" />
                </>
              )}
            </Carousel>

            {images.length > 1 && (
              <>
                <div className="text-center mt-4 text-sm text-muted-foreground">
                  Foto {current + 1} de {images.length}
                </div>

                <div className="flex gap-2 mt-4 justify-center flex-wrap">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => api?.scrollTo(index)}
                      className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                        current === index
                          ? "border-primary scale-105"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Miniatura ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductGalleryDialog;
