import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const IndexPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Split Bill App
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Easily split bills and expenses with friends and family
        </p>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link to="/create">
              Create New Bill
            </Link>
          </Button>
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Or join an existing bill with an ID
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndexPage; 