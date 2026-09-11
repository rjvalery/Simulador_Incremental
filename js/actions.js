// actions.js - Gestión de asignación laboral corregida

export function modifyWorkerAllocation(state, amount) {
    // Asegurar estructura demográfica con pool de ciudadanos libres (desempleados)
    if (!state.population) {
        state.population = { free: 0, workers: 0, technicians: 0 };
    }
    
    const maxPop = (state.buildings.shelter || 0) * 5;
    const currentAssigned = state.population.workers + state.population.technicians;
    const totalPopulation = currentAssigned + (state.population.free || 0);

    // Intentar asignar obreros (requiere ciudadanos libres y respetar el límite de vivienda)
    if (amount > 0) {
        if (state.population.free >= amount && currentAssigned + amount <= maxPop) {
            state.population.free -= amount;
            state.population.workers += amount;
            window.dispatchEvent(new CustomEvent('log:add', {
                detail: { message: `Un ciudadano ha comenzado a laborar como obrero.`, type: 'success' }
            }));
        } else if (totalPopulation < maxPop && state.population.free < amount) {
            window.dispatchEvent(new CustomEvent('log:add', {
                detail: { message: `No hay ciudadanos libres suficientes para asignar.`, type: 'warning' }
            }));
        } else {
            window.dispatchEvent(new CustomEvent('log:add', {
                detail: { message: `Límite de población (Refugios) alcanzado.`, type: 'warning' }
            }));
        }
    } 
    // Liberar/Desasignar obrero (convierte el puesto en vacante y libera al ciudadano)
    else if (amount < 0) {
        const absAmount = Math.abs(amount);
        if (state.population.workers >= absAmount) {
            state.population.workers -= absAmount;
            state.population.free = (state.population.free || 0) + absAmount;
            window.dispatchEvent(new CustomEvent('log:add', {
                detail: { message: `Un puesto de trabajo ha quedado vacante.`, type: 'info' }
            }));
        }
    }
}