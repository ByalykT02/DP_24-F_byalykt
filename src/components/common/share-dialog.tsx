import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Share2,
  Copy,
  Check,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Alert, AlertDescription } from "~/components/ui/alert";

interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: "artwork" | "collection";
  name: string;
  id: number;
}

type SharePlatform = "twitter" | "facebook" | "linkedin" | "email";

// Fixed interface definition
type ShareLinks = Record<SharePlatform, string>;

const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onOpenChange,
  type,
  name,
  id,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [shareError, setShareError] = useState<string>("");

  const basePath = type === "artwork" ? "artworks" : "collections";
  const itemUrl = `${window.location.origin}/${basePath}/${id}`;
  const encodedUrl = encodeURIComponent(itemUrl);
  const encodedName = encodeURIComponent(
    `Check out this ${type}: ${name}`,
  );

  const shareLinks: ShareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedName}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedName}&body=Check%20out%20this%20${type}:${encodedUrl}`,
  };

  const handleNativeShare = async (): Promise<void> => {
    try {
      await navigator.share({
        title: name,
        text: `Check out this ${type}: ${name}`,
        url: itemUrl,
      });
      setShareError("");
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setShareError("Failed to share. Please try another method.");
      }
    }
  };

  const handleCopyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(itemUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShareError("");
    } catch (error) {
      setShareError(
        "Failed to copy link. Please try manually selecting and copying.",
      );
    }
  };

  const handleSocialShare = (platform: SharePlatform): void => {
    window.open(
      shareLinks[platform],
      "_blank",
      "noopener,noreferrer,width=600,height=600",
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share {type === "artwork" ? "Artwork" : "Collection"}</DialogTitle>
          <DialogDescription>
            Choose how you'd like to share "{name}"
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="quick" className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick">Quick Share</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-4">
            {"share" in navigator && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleNativeShare}
              >
                <Share2 className="h-4 w-4" />
                Share directly
              </Button>
            )}

            <div className="flex space-x-2">
              <Input readOnly value={itemUrl} className="flex-1" />
              <Button
                variant="secondary"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="social" className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleSocialShare("twitter")}
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleSocialShare("facebook")}
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleSocialShare("linkedin")}
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => (window.location.href = shareLinks.email)}
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
          </TabsContent>
        </Tabs>

        {shareError && (
          <Alert variant="destructive">
            <AlertDescription>{shareError}</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
