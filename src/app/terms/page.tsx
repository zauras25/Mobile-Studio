import PolicyPage from "@/components/PolicyPage";

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms and conditions"
      description="How this store's catalog, customer orders, ratings, and retailer applications currently work."
      sections={[
        {
          heading: "Using the website",
          paragraphs: [
            "Use the site to browse mobile spare parts, submit a customer order request, manage an account, leave a product rating, or apply for retailer access. Provide accurate contact and delivery information, and do not attempt to interfere with the site or access another person's account.",
            "Catalog descriptions, device models, images, prices, and stock help identify products but may not answer every compatibility question. Check the exact device model and part fit with the store before ordering or installing a part if there is any doubt.",
          ],
        },
        {
          heading: "Orders, prices, and payment",
          paragraphs: [
            "Checkout records your selected products and the name and Pakistani mobile number you provide. For delivery it also records your address, city, and area; delivery charges are calculated from the store's configured rate for that location. You may instead request store pickup, which has no delivery charge; wait for the store to confirm the pickup address and readiness before travelling. Submitting checkout creates an order request and does not charge a payment method.",
            "When available, the site displays a six-digit tracking code after checkout. Use it with the same phone number entered at checkout to look up order status. A displayed estimate is not a confirmed delivery appointment. Contact the store promptly to ask whether an order can still be changed or cancelled.",
          ],
        },
        {
          heading: "Accounts, reviews, and retailer applications",
          paragraphs: [
            "Customer accounts use email and password sign-in in production. Keep your password private. Product ratings must be submitted from a signed-in customer account and may be moderated before they appear; development demo ratings stay in that browser and are not published.",
            "A retailer application collects business contact details and required business proof for review. Applying does not create a retailer login or guarantee approval. The store must approve the application and set up retailer access separately; wholesale pricing, minimum order quantities, payment, and delivery terms must be agreed with the store.",
          ],
        },
        {
          heading: "Changes and questions",
          paragraphs: [
            "The store may correct catalog or website information. Before this draft becomes final, the store should add its confirmed cancellation, complaint, legal business identity, jurisdiction, and dispute-handling terms.",
          ],
        },
      ]}
      confirmationItems={[
        "When order acceptance is final and the process/time limit for changes or cancellations",
        "Final delivery, payment, returns, warranty, and complaint-handling arrangements",
        "Legal business identity, jurisdiction, and any mandatory consumer notices",
      ]}
    />
  );
}
