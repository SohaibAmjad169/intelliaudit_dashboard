import { useNavigate } from 'react-router-dom';
import { Button } from '../components/shared/actions/Button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-lg text-gray-600 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Button
          onClick={() => navigate(-1)}
          variant="primary"
        >
          Go Back
        </Button>
      </div>
    </div>
  );
}
