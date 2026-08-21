import { useState } from "react";
import { CreditCard, Smartphone, QrCode, Apple, Landmark } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PAYMENT_METHODS, kzt, type PaymentMethod } from "@/lib/mock-db";
import { cn } from "@/lib/utils";

const ICONS: Record<PaymentMethod, typeof CreditCard> = {
  "Kaspi QR": QrCode,
  "Kaspi Pay": Smartphone,
  "Apple Pay": Apple,
  "Google Pay": Smartphone,
  "Visa / Mastercard": CreditCard,
  Paybox: Landmark,
  Robokassa: Landmark,
};

export function PaymentDialog({
  open,
  onOpenChange,
  title,
  amount,
  onConfirm,
  extra,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  amount: number;
  onConfirm: (method: PaymentMethod) => void;
  extra?: React.ReactNode;
}) {
  const [method, setMethod] = useState<PaymentMethod>("Kaspi QR");
  const [processing, setProcessing] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout — {title}</DialogTitle>
          <DialogDescription>
            Simulated payment gateway. Amount due: <b className="text-foreground">{kzt(amount)}</b>
          </DialogDescription>
        </DialogHeader>

        {extra}

        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map((m) => {
            const Icon = ICONS[m];
            return (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-3 text-left text-sm transition-all",
                  method === m && "border-primary/60 neon-glow",
                )}
              >
                <Icon className="size-4 text-accent" />
                {m}
              </button>
            );
          })}
        </div>

        {method === "Kaspi QR" && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
            <QrCode className="size-10 text-primary" />
            Scan the Kaspi QR in the app to confirm the payment.
          </div>
        )}

        <DialogFooter>
          <Button
            className="w-full"
            disabled={processing}
            onClick={() => {
              setProcessing(true);
              setTimeout(() => {
                setProcessing(false);
                onConfirm(method);
              }, 500);
            }}
          >
            {processing ? "Processing…" : `Pay ${kzt(amount)} with ${method}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
