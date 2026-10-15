import PolicyPage from "@/components/PolicyPage";

export default function ReturnsPolicyPage() {
  return (
    <PolicyPage
      title="Returns and refunds"
      description="What to do if a mobile spare part or customer order has a problem. Confirm the resolution with the store."
      sections={[
        {
          heading: "Contact the store before returning a product",
          paragraphs: [
            "If you receive the wrong item, find a problem, or need to discuss an order, contact the store before sending anything back. Provide the six-digit order tracking code, checkout phone number, product name, and a clear description of the issue.",
            "Keep the item, packaging, included accessories, and order information available while the store reviews your request. Do not ship or hand over a product for return until the store confirms the return address and instructions. This draft does not set a return window or guarantee that every request will qualify.",
          ],
        },
        {
          heading: "Parts, installation, and warranty",
          paragraphs: [
            "Mobile spare parts can be model-specific. Check the exact phone model and compatibility with the store before ordering. If installation is needed, consider having it done by a qualified technician and avoid fitting a part until you have checked it is the correct item.",
            "Warranty availability, duration, coverage, testing requirements, and exclusions depend on the specific product and must be confirmed by the store before purchase or installation. This general draft does not promise a warranty or cover damage caused during installation, handling, or use.",
          ],
        },
        {
          heading: "Refunds and exchanges",
          paragraphs: [
            "After reviewing the product and order details, the store will discuss the available resolution for your case, which may include further troubleshooting, an exchange, replacement, or refund where applicable. The store must confirm eligibility, inspection steps, shipping responsibility, payment method, and timing. No fixed refund or exchange window is established by this draft.",
          ],
        },
      ]}
      confirmationItems={[
        "Return/exchange window, product condition, and evidence needed for a claim",
        "Product-by-product warranty period, exclusions, and inspection procedure",
        "Resolution choices, return shipping responsibility, and refund timing",
      ]}
    />
  );
}
