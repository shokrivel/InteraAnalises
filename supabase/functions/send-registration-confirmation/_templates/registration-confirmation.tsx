import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface RegistrationConfirmationEmailProps {
  userEmail: string;
  confirmationUrl: string;
  userName?: string;
}

export const RegistrationConfirmationEmail = ({
  userEmail,
  confirmationUrl,
  userName,
}: RegistrationConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirme seu cadastro no InteraSaúde</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <div style={logo}>
            ❤️ InteraSaúde
          </div>
        </Section>
        
        <Heading style={h1}>Bem-vindo ao InteraSaúde!</Heading>
        
        <Text style={text}>
          Olá{userName ? ` ${userName}` : ''},
        </Text>
        
        <Text style={text}>
          Obrigado por se cadastrar no InteraSaúde! Para concluir seu registro e ativar sua conta ({userEmail}), 
          clique no botão abaixo para confirmar seu cadastro:
        </Text>
        
        <Section style={buttonContainer}>
          <Link
            href={confirmationUrl}
            target="_blank"
            style={button}
          >
            Confirmar Cadastro
          </Link>
        </Section>
        
        <Text style={text}>
          Este link expira em 24 horas por motivos de segurança.
        </Text>
        
        <Hr style={hr} />
        
        <Text style={footer}>
          Se você não se cadastrou no InteraSaúde, pode ignorar este email com segurança.
        </Text>
        
        <Text style={footer}>
          Caso tenha problemas com o botão, copie e cole este link no seu navegador:<br />
          <Link href={confirmationUrl} style={link}>
            {confirmationUrl}
          </Link>
        </Text>
        
        <Text style={signature}>
          Atenciosamente,<br />
          Equipe InteraSaúde
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RegistrationConfirmationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const logoSection = {
  padding: '32px',
  textAlign: 'center' as const,
}

const logo = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#0066cc',
}

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 32px',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 32px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#0066cc',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  width: '200px',
  padding: '14px 20px',
}

const link = {
  color: '#0066cc',
  textDecoration: 'underline',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
  padding: '0 32px',
}

const signature = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '32px 0 16px',
  padding: '0 32px',
}