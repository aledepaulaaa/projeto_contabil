const { expect } = require('chai');
const sinon = require('sinon');

// O use case não existe ainda, o teste falhará no import ou na execução
describe('Unit Test: SendMessageUseCase', () => {
    it('Deve disparar um erro se o Provedor de WhatsApp não estiver inicializado', async () => {
        try {
            const SendMessageUseCase = require('../../src/use-cases/SendMessageUseCase');
            const useCase = new SendMessageUseCase(null); // Sem provider
            await useCase.execute({ to: '5511999999999', message: 'Teste' });
            expect.fail('Deveria ter lançado erro');
        } catch (error) {
            expect(error.message).to.equal('WhatsApp Provider não configurado');
        }
    });

    it('Deve chamar o método sendMessage do provider corretamente', async () => {
        const mockProvider = {
            sendMessage: sinon.stub().resolves({ success: true, messageId: '123' })
        };
        
        const SendMessageUseCase = require('../../src/use-cases/SendMessageUseCase');
        const useCase = new SendMessageUseCase(mockProvider);
        
        const result = await useCase.execute({ to: '5511999999999', message: 'Olá Gemini' });
        
        expect(mockProvider.sendMessage.calledOnce).to.be.true;
        expect(result.success).to.be.true;
    });
});
