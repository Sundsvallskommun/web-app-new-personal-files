import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { DocumentController } from '@/controllers/document.controller';
import { SearchDocument } from '@/responses/document.response';

describe('decorator metadata', () => {
  it('records the body type of a controller action', () => {
    const types = Reflect.getMetadata('design:paramtypes', DocumentController.prototype, 'getDocuments');

    expect(types).toContain(SearchDocument);
  });
});
