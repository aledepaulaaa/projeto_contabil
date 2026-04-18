import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WaitTimer } from './WaitTimer';
import React from 'react';

describe('WaitTimer SLA Logic', () => {
    it('deve mostrar "Chegou agora" para menos de 90 segundos', () => {
        const ninetySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
        render(<WaitTimer startTimeStr={ninetySecondsAgo} showStatus />);
        expect(screen.getByText(/Chegou agora/i)).toBeDefined();
    });

    it('deve mostrar "Aguardando ainda" para entre 90 e 120 segundos', () => {
        const interval = new Date(Date.now() - 100 * 1000).toISOString();
        render(<WaitTimer startTimeStr={interval} showStatus />);
        expect(screen.getByText(/Aguardando ainda/i)).toBeDefined();
    });

    it('deve mostrar apenas "Crítico" sem o tempo no label para mais de 120 segundos', () => {
        const longAgo = new Date(Date.now() - 300 * 1000).toISOString();
        render(<WaitTimer startTimeStr={longAgo} showStatus />);
        const element = screen.getByText(/Crítico/i);
        expect(element.textContent).not.toContain('Há mais de 1 min'); // DEVE FALHAR: Atualmente contém
    });
});
