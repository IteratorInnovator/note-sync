import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Play } from "lucide-react";

export const VideoCard = ({ title, thumbnail, duration, createdAt }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
      <div className="relative aspect-video bg-muted">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="rounded-full bg-primary/90 p-4">
            <Play className="h-6 w-6 text-primary-foreground fill-current" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          {duration}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold line-clamp-2">{title}</h3>
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0">
        <p className="text-sm text-muted-foreground">{createdAt}</p>
      </CardFooter>
    </Card>
  );
};
