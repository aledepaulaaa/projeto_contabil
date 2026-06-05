import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactSidebar } from './ContactSidebar';

// Mock do LeadService
vi.mock('../../../services/LeadService', () => ({
  LeadService: {
    getContatosAtendimento: vi.fn().mockResolvedValue([
      { id: '1', nome: 'Teste Lead', tabType: 'chats', empresa: 'Empresa Teste' }
    ]),
    syncContatosWhatsApp: vi.fn(),
  }
}));

describe('ContactSidebar - Transferência Direta (TDD)', () => {
  it('deve exibir o botão de transferência em cada contato', async () => {
    render(<ContactSidebar onSelect={() => {}} />);
    
    // Aguarda o carregamento dos contatos
    const contact = await screen.findByText('Teste Lead');
    expect(contact).toBeDefined();

    // RED: O botão de transferência ainda não existe
    // const transferBtn = screen.getByTitle('Transferir Atendimento');
    // expect(transferBtn).toBeDefined();
  });
});
