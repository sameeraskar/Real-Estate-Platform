type Props = {
    brandName: string;
    tagline: string | null;
    phone: string | null;
    email: string | null;
  };
  
  export default function ClassicTemplate({
    brandName,
    tagline,
    phone,
    email,
  }: Props) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h1 className="text-4xl font-serif">{brandName}</h1>
          <p className="mt-4 text-lg">{tagline}</p>
  
          <div className="mt-8 text-sm text-gray-700">
            {phone && <div>{phone}</div>}
            {email && <div>{email}</div>}
          </div>
        </div>
      </div>
    );
  }
  