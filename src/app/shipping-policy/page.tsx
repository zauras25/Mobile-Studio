import PolicyPage from "@/components/PolicyPage";

export default function ShippingPolicyPage() {
  return (
    <PolicyPage
      title="Shipping policy"
      description="How customer delivery is currently represented in checkout and what to confirm with the store."
      sections={[
        {
          heading: "Delivery confirmation",
          paragraphs: [
            "Enter a complete delivery address, city, area, and reachable Pakistani mobile number at checkout. The delivery charge is calculated using the store's confirmed rate for that city and area. Delivery is available only for locations with a configured rate; contact the store if your area is not listed.",
            "At checkout you may request PostEx, TCS, Leopards Courier, M&P, or Pakistan Post, or let the store choose an available service. This is a preference, not a confirmed booking. The store will choose based on destination coverage, service availability, parcel requirements, and cost, and confirm the actual courier before dispatch. A nearby branch or service in every area is not guaranteed.",
            "The applicable location-based charge (including any configured area-specific free-delivery minimum) is shown before submitting the order request. The store will confirm the order and payment before dispatch.",
            "You may choose store pickup instead of delivery. No delivery charge applies, but wait for the store to confirm the pickup address and that the order is ready before travelling.",
          ],
        },
        {
          heading: "Order preparation and delivery updates",
          paragraphs: [
            "Submitting checkout records an order request; it does not by itself confirm stock, dispatch, or a delivery date. The store should confirm the products, final total, payment arrangement, address, and delivery estimate before fulfillment.",
            "Use the six-digit tracking code shown after checkout together with the checkout phone number to check the latest recorded order status. Tracking status is not a courier location feed or guaranteed arrival time. Contact the store promptly if your address or phone number is incorrect.",
          ],
        },
        {
          heading: "Delays or delivery problems",
          paragraphs: [
            "Report a missing, delayed, damaged, or unsuccessful delivery to the store with your tracking code and checkout phone number. The store will review the order and confirm the next steps. Courier coverage, dispatch cut-off times, delay commitments, and redelivery charges must be confirmed with the store; this draft does not promise a delivery window.",
          ],
        },
      ]}
      confirmationItems={[
        "Areas served, couriers used, and any delivery cut-off times",
        "Verified delivery charge/free-delivery thresholds and realistic estimates",
        "How delay, loss, damage, failed delivery, or redelivery costs are handled",
      ]}
    />
  );
}
