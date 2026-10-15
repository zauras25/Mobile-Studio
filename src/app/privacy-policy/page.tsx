import PolicyPage from "@/components/PolicyPage";

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy policy"
      description="How this store's website uses account, order, review, and retailer application information."
      sections={[
        {
          heading: "Information handled",
          paragraphs: [
            "If you create or use a customer account, the site processes your email and account display name. If you place an order, it stores your name, phone number, selected products, fulfillment choice, order status, and tracking reference. Delivery orders also store the delivery address, city, and area used to calculate the configured location-based charge; pickup orders store the pickup choice instead.",
            "If you submit a product rating, the site stores the product, rating, account name, and moderation status. If you apply for retailer access, the application includes your name, email, phone, business details, address, selected business type, consent, and uploaded business proof. The site also processes technical data needed to operate and secure the service; exact log and analytics settings should be confirmed before launch.",
          ],
        },
        {
          heading: "How information is used",
          paragraphs: [
            "The store uses these details to sign customers in, process and track order requests, contact customers about orders, assess retailer applications, moderate product ratings, and respond to customer-care requests.",
            "The site is connected to Supabase for customer authentication, database records, and file storage. Retailer proof documents are stored in a private storage bucket and are intended for review by authorized store administrators, not public browsing.",
          ],
        },
        {
          heading: "Sharing, storage, and security",
          paragraphs: [
            "The checkout form does not collect payment-card details; payment arrangements are confirmed with the store. In local development, the mock account keeps only its email and display name in that browser's local storage and does not store the password or send it to Supabase Auth.",
            "Account, order, review, and application data is available to the store through its connected services. The store should restrict administrative access and protect credentials and private documents. Information may also be disclosed if required by law or needed to address fraud, security, or service issues.",
          ],
        },
        {
          heading: "Your requests and policy changes",
          paragraphs: [
            "Contact the store through the customer-care page to ask about correcting or removing information associated with your account, order, review, or retailer application. The store may need to verify your identity and may have to retain records needed for an open order, security, or legal obligations.",
            "The store should publish its verified legal identity and contact details, actual retention schedule, analytics/cookie settings, and the process and response times for privacy requests before treating this draft as final.",
          ],
        },
      ]}
      confirmationItems={[
        "Verified business identity and contact for privacy requests",
        "Actual analytics, cookie, server-log, and retention settings",
        "Final request process, retention periods, and applicable legal disclosures",
      ]}
    />
  );
}
