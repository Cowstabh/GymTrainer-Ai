import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { dynamoDbClient } from "@/lib/dynamodb";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username or Email", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Assume users are stored with PK as username
          const params = {
            TableName: process.env.DYNAMODB_TABLE_USERS || "Users",
            Key: {
              username: { S: credentials.username },
            },
          };
          const command = new GetItemCommand(params);
          const response = await dynamoDbClient.send(command);
          
          if (!response.Item) {
            return null;
          }

          const user = {
            id: response.Item.username?.S as string,
            name: response.Item.name?.S || credentials.username,
            email: response.Item.email?.S,
            password: response.Item.password?.S,
          };

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password || "");

          if (isPasswordValid) {
            return {
              id: user.id,
              name: user.name,
              email: user.email
            };
          }
          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.name = token.name as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
