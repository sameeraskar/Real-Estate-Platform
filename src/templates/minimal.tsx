type Props = {
    brandName: string;
    tagline: string | null;
    phone: string | null;
    email: string | null;
  };
  
  export default function MinimalTemplate({
    brandName,
    tagline,
    phone,
    email,
  }: Props) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">{brandName}</h1>
          <p className="mt-2 text-gray-600">{tagline}</p>
  
          <div className="mt-6 text-sm">
            {phone && <div>{phone}</div>}
            {email && <div>{email}</div>}
          </div>
        </div>
      </div>
    );
  }
  