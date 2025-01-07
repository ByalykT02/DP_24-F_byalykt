import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "~/components/ui/alert-dialog";

type ActionDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: () => void;
  title: string;
  description: string;
  buttonText: string;
};

export default function ActionDialog({
  isOpen,
  onOpenChange,
  onAction,
  title,
  description,
  buttonText
}: ActionDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onAction}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {buttonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
