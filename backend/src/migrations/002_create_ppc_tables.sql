-- Criação das tabelas para a funcionalidade de PPC

-- Tabela de Cursos
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    nature VARCHAR(50) NOT NULL, -- bacharelado, tecnologo, licenciatura
    total_periods INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Períodos
CREATE TABLE IF NOT EXISTS periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    period_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(course_id, period_number)
);

-- Tabela de Disciplinas
CREATE TABLE IF NOT EXISTS disciplines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    hours INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Pré-requisitos de Disciplinas
CREATE TABLE IF NOT EXISTS discipline_prerequisites (
    discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
    prerequisite_discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (discipline_id, prerequisite_discipline_id)
);

-- Comentários para detalhar o que foi feito
COMMENT ON TABLE courses IS 'Armazena informações gerais sobre os cursos (PPCs).';
COMMENT ON TABLE periods IS 'Armazena os períodos vinculados a cada curso.';
COMMENT ON TABLE disciplines IS 'Armazena as disciplinas de cada período.';
COMMENT ON TABLE discipline_prerequisites IS 'Gerencia os pré-requisitos entre as disciplinas.';
