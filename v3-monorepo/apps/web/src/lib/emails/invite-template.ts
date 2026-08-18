/**
 * Template HTML do email de convite para equipe do MarkLabs.
 * Usa cores da marca (laranja #ea580c) e design premium.
 */
export function buildInviteEmail({
  teamName,
  inviterName,
  role,
  inviteUrl,
}: {
  teamName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
}) {
  const roleLabels: Record<string, string> = {
    ADMIN: "Administrador",
    EDITOR: "Editor",
    VIEWER: "Visualizador",
  };
  const roleLabel = roleLabels[role] ?? role;

  return /* html */ `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Convite para a equipe ${teamName} · MarkLabs</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header com logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#ea580c,#c2410c);border-radius:14px;padding:12px 16px;display:inline-block;">
                    <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Mark<span style="color:#fed7aa;">Labs</span></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td style="background:#1a1a1a;border-radius:20px;border:1px solid #2a2a2a;overflow:hidden;">

              <!-- Faixa laranja no topo -->
              <tr>
                <td style="background:linear-gradient(135deg,#ea580c,#c2410c);padding:4px 0;"></td>
              </tr>

              <!-- Conteúdo -->
              <tr>
                <td style="padding:40px 48px;">

                  <!-- Ícone de convite -->
                  <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                    <tr>
                      <td style="background:rgba(234,88,12,0.15);border:1px solid rgba(234,88,12,0.3);border-radius:50%;width:60px;height:60px;text-align:center;vertical-align:middle;">
                        <span style="font-size:28px;line-height:60px;">✉️</span>
                      </td>
                    </tr>
                  </table>

                  <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">
                    Você foi convidado para<br/>
                    <span style="color:#fb923c;">${teamName}</span>
                  </h1>

                  <p style="margin:0 0 28px;font-size:15px;color:#a0a0a0;line-height:1.7;">
                    <strong style="color:#e0e0e0;">${inviterName}</strong> te convidou para fazer parte da equipe
                    <strong style="color:#e0e0e0;">${teamName}</strong> no MarkLabs com o papel de
                    <strong style="color:#fb923c;">${roleLabel}</strong>.
                  </p>

                  <!-- Badge de função -->
                  <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                    <tr>
                      <td style="background:rgba(234,88,12,0.15);border:1px solid rgba(234,88,12,0.3);border-radius:8px;padding:10px 18px;">
                        <span style="font-size:13px;font-weight:700;color:#fb923c;text-transform:uppercase;letter-spacing:0.06em;">
                          Função: ${roleLabel}
                        </span>
                      </td>
                    </tr>
                  </table>

                  <!-- Botão CTA -->
                  <table cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
                    <tr>
                      <td align="center" style="background:linear-gradient(135deg,#ea580c,#c2410c);border-radius:12px;box-shadow:0 0 24px rgba(234,88,12,0.4);">
                        <a href="${inviteUrl}" target="_blank"
                           style="display:inline-block;padding:16px 40px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">
                          Aceitar Convite →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Divisor -->
                  <hr style="border:none;border-top:1px solid #2a2a2a;margin:0 0 24px;" />

                  <!-- URL manual -->
                  <p style="margin:0 0 6px;font-size:12px;color:#666666;">
                    Se o botão não funcionar, copie e cole o link abaixo no navegador:
                  </p>
                  <p style="margin:0;font-size:12px;color:#ea580c;word-break:break-all;">
                    ${inviteUrl}
                  </p>
                </td>
              </tr>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#444444;">
                Este convite expira em 7 dias. Se você não esperava este email, pode ignorá-lo com segurança.
              </p>
              <p style="margin:0;font-size:12px;color:#333333;">
                © ${new Date().getFullYear()} MarkLabs · Plataforma de Social Media
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
