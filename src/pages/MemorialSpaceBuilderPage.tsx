import { useParams } from 'react-router-dom';
import { MemorialSpaceBuilder } from '../components/MemorialSpaceBuilder';

export function MemorialSpaceBuilderPage() {
  const { spaceId } = useParams();

  return (
    <MemorialSpaceBuilder 
      spaceId={spaceId} 
      onClose={() => window.history.back()}
    />
  );
}