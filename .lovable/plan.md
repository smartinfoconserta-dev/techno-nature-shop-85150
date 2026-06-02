## Plano de correção

Vou corrigir os três problemas que apareceram após a última atualização:

1. **Cupom aparece como aplicado, mas preço não muda**
   - Ajustar a lógica do modal do produto para aplicar o preço de desconto assim que o cupom válido for digitado.
   - Garantir que o parcelamento também seja recalculado usando o preço com desconto.
   - Tratar o caso em que o produto não tem preço lojista configurado, para não mostrar “cupom aplicado” como se tivesse desconto real.

2. **Login admin diz que entrou, mas fica preso na tela inicial até apertar F5**
   - Corrigir o fluxo do `AdminLoginDialog` para aguardar a sessão e a validação de admin antes de navegar.
   - Fechar o menu/dialog corretamente no mobile antes de redirecionar.
   - Evitar condição de corrida entre login, checagem de permissão e proteção da rota `/admin`.

3. **Cadastro/finalização de produto fica preso ou parece dar erro**
   - Remover o bloqueio automático de recarregar/fechar página causado pelo rascunho salvo em `sessionStorage`, que pode deixar o navegador parecendo travado.
   - Garantir que o formulário sempre destrave o botão de salvar, inclusive quando der erro.
   - Limpar o estado do formulário e do rascunho somente depois que o produto for salvo com sucesso.

4. **Verificação final**
   - Revisar o comportamento em desktop/mobile do fluxo: aplicar cupom, entrar no admin e salvar produto.
   - Manter as mudanças focadas nesses bugs, sem alterar regras de preço ou visual além do necessário.