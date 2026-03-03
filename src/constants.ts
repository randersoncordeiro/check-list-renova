export interface ChecklistItem {
  id: string;
  category: string;
  text: string;
}

export const CHECKLIST_DATA: ChecklistItem[] = [
  // LIMPEZA
  { id: 'limp_1', category: 'LIMPEZA', text: 'O Equipamento foi entregue com limpeza bem executada?' },
  { id: 'limp_2', category: 'LIMPEZA', text: 'A Administração fez o recolhimento dos entulhos?' },
  
  // SERVIÇOS EM ESTRUTURAS METÁLICAS
  { id: 'met_1', category: 'SERVIÇOS EM ESTRUTURAS METÁLICAS', text: 'As estruturas foram bem soldadas?' },
  { id: 'met_2', category: 'SERVIÇOS EM ESTRUTURAS METÁLICAS', text: 'As estruturas foram bem lixadas ?' },
  { id: 'met_3', category: 'SERVIÇOS EM ESTRUTURAS METÁLICAS', text: 'As estruturas foram bem pintadas?' },
  { id: 'met_4', category: 'SERVIÇOS EM ESTRUTURAS METÁLICAS', text: 'Em caso de tela, estão bem instaladas? (sem pontas e bem amarradas)' },
  { id: 'met_5', category: 'SERVIÇOS EM ESTRUTURAS METÁLICAS', text: 'Houve alguma patologia na estrutura?' },
  { id: 'met_6', category: 'SERVIÇOS EM ESTRUTURAS METÁLICAS', text: 'Em caso de fabricação de peças (ex. Portão), foram bem executadas?' },
  
  // SERVIÇOS EM ESTRUTURAS DE MADEIRA
  { id: 'mad_1', category: 'SERVIÇOS EM ESTRUTURAS DE MADEIRA', text: 'As estruturas foram bem fixadas?' },
  { id: 'mad_2', category: 'SERVIÇOS EM ESTRUTURAS DE MADEIRA', text: 'As estruturas foram bem lixadas ?' },
  { id: 'mad_3', category: 'SERVIÇOS EM ESTRUTURAS DE MADEIRA', text: 'As estruturas foram bem pintadas?' },
  { id: 'mad_4', category: 'SERVIÇOS EM ESTRUTURAS DE MADEIRA', text: 'Houve alguma patologia na estrutura?' },
  
  // SERVIÇOS EM ESTRUTURAS DE CONCRETO
  { id: 'conc_1', category: 'SERVIÇOS EM ESTRUTURAS DE CONCRETO', text: 'As Calçadas foram bem executadas ou corrigidas?' },
  { id: 'conc_2', category: 'SERVIÇOS EM ESTRUTURAS DE CONCRETO', text: 'Foram bem executadas as calçadas de acessibilidade?' },
  { id: 'conc_3', category: 'SERVIÇOS EM ESTRUTURAS DE CONCRETO', text: 'As fissuras e trincas foram bem reparadas?' },
  { id: 'conc_4', category: 'SERVIÇOS EM ESTRUTURAS DE CONCRETO', text: 'Havia tinta Epoxi na estrutura antes das atividades?' },
  { id: 'conc_5', category: 'SERVIÇOS EM ESTRUTURAS DE CONCRETO', text: 'As Superfícies foram bem lixadas?' },
  { id: 'conc_6', category: 'SERVIÇOS EM ESTRUTURAS DE CONCRETO', text: 'As Superfícies foram bem pintadas?' },
  { id: 'conc_7', category: 'SERVIÇOS EM ESTRUTURAS DE CONCRETO', text: 'As marcações com fita foram bem executadas?' },
  { id: 'conc_8', category: 'SERVIÇOS EM ESTRUTURAS DE CONCRETO', text: 'Após a pintura apareceu alguma patologia?' },
  { id: 'conc_9', category: 'SERVIÇOS EM ESTRUTURAS DE CONCRETO', text: 'Após a pintura houve diferença de tonalidade por lotes diferentes?' },
  
  // REGISTROS DIVERSOS
  { id: 'reg_1', category: 'REGISTROS DIVERSOS', text: 'O lanche dos alunos foi entregue nos horários previstos?' },
  { id: 'reg_2', category: 'REGISTROS DIVERSOS', text: 'O instrutor cumpriu o cronograma didático?' },
  { id: 'reg_3', category: 'REGISTROS DIVERSOS', text: 'O instrutor fez chamada diariamente?' },
  { id: 'reg_4', category: 'REGISTROS DIVERSOS', text: 'Os alunos usaram os equipamentos de segurança – EPI?' },
  { id: 'reg_5', category: 'REGISTROS DIVERSOS', text: 'O SENAI entregou os equipamentos de segurança aos alunos?' },
  { id: 'reg_6', category: 'REGISTROS DIVERSOS', text: 'Os ônibus que conduzem os alunos para o ponto de intervenção foram pontuais?' },
];
