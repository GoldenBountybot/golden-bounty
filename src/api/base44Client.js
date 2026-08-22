// Compatibility layer: the app keeps importing `base44`, but every call now
// runs against the app's own Supabase project (Postgres + Edge Functions),
// so no platform integration credits are consumed.
import { supabase } from '@/api/supabaseClient';
import { entities } from '@/api/supabaseEntities';
import * as auth from '@/api/supabaseAuth';
import { invoke, uploadFile } from '@/api/supabaseFunctions';

const unsupported = (name) => async () => {
  throw new Error(`${name} is not available on the Supabase backend`);
};

export const base44 = {
  supabase,
  entities,
  auth,
  functions: { invoke },
  integrations: {
    Core: {
      UploadFile: uploadFile,
      UploadPrivateFile: uploadFile,
      InvokeLLM: unsupported('InvokeLLM'),
      SendEmail: unsupported('SendEmail'),
      GenerateImage: unsupported('GenerateImage'),
      ExtractDataFromUploadedFile: unsupported('ExtractDataFromUploadedFile'),
      CreateFileSignedUrl: unsupported('CreateFileSignedUrl'),
    },
  },
  users: { inviteUser: unsupported('inviteUser') },
  analytics: { track: () => {} },
};

export default base44;