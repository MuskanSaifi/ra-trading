import { TONE_CLASSES, statusLabel, statusTone } from "@/lib/orderStatus";

export default function OrderStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        TONE_CLASSES[statusTone(status)]
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}
