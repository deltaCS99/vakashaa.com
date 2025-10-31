// app/_components/footer.tsx
export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-semibold mb-3">SA Tours</h3>
            <p className="text-sm text-gray-600">
              Your trusted platform for booking domestic tours across South Africa.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-medium mb-3">Explore</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="/tours" className="hover:text-gray-900">
                  All Tours
                </a>
              </li>
              <li>
                <a href="/tours?destination=cape-town" className="hover:text-gray-900">
                  Cape Town
                </a>
              </li>
              <li>
                <a href="/tours?destination=kruger" className="hover:text-gray-900">
                  Kruger Park
                </a>
              </li>
              <li>
                <a href="/tours?destination=garden-route" className="hover:text-gray-900">
                  Garden Route
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-medium mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="/about" className="hover:text-gray-900">
                  About Us
                </a>
              </li>
              <li>
                <a href="/blog" className="hover:text-gray-900">
                  Travel Guide
                </a>
              </li>
              <li>
                <a href="/operator/apply" className="hover:text-gray-900">
                  Become an Operator
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-gray-900">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-medium mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="/help" className="hover:text-gray-900">
                  Help Center
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-gray-900">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-gray-900">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/cancellation" className="hover:text-gray-900">
                  Cancellation Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} SA Tours. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
