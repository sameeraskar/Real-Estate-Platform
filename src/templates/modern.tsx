type Props = {
    brandName: string;
    tagline: string | null;
    phone: string | null;
    email: string | null;
  };
  
  export default function ModernTemplate({
    brandName,
    tagline,
    phone,
    email,
  }: Props) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b">
          <div className="max-w-5xl mx-auto px-6 py-6 flex justify-between">
            <h1 className="text-2xl font-bold">{brandName}</h1>
            <div className="text-sm text-gray-600 space-x-4">
              {phone && <span>{phone}</span>}
              {email && <span>{email}</span>}
            </div>
          </div>
        </header>
  
        <section className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl font-semibold">{tagline}</h2>
          <p className="mt-4 text-gray-600">
            Trusted real estate expertise for buyers and sellers.
          </p>
        </section>
      </div>
    );
  }
  