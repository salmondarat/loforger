import { describe, it, expect } from 'vitest';
import { createTemplateLoader } from '../../src/templates/template-loader.js';

describe('TemplateLoader', () => {
  it('should load template manifest', async () => {
    const loader = createTemplateLoader();
    const manifest = await loader.loadManifest('nextjs-supabase-mvp');
    
    expect(manifest).not.toBeNull();
    expect(manifest?.id).toBe('nextjs-supabase-mvp');
    expect(manifest?.name).toBe('Next.js + Supabase MVP');
  });

  it('should list available templates', async () => {
    const loader = createTemplateLoader();
    const templates = await loader.listTemplates();
    
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.some(t => t.id === 'nextjs-supabase-mvp')).toBe(true);
  });
});
