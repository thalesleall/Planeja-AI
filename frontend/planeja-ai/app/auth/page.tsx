"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface LoginData {
    email: string
    password: string
}

interface RegisterData {
    name: string
    email: string
    password: string
}

export default function AuthPage() {
    const [mode, setMode] = useState<'login' | 'register'>('login')

    // Estados para login
    const [loginData, setLoginData] = useState<LoginData>({
        email: '',
        password: ''
    })

    // Estados para cadastro
    const [registerData, setRegisterData] = useState<RegisterData>({
        name: '',
        email: '',
        password: ''
    })

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Dados de login:', loginData)
        // Aqui você conectará com o backend futuramente
    }

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Dados de cadastro:', registerData)
        // Aqui você conectará com o backend futuramente
    }

    const toggleMode = () => {
        setMode(mode === 'login' ? 'register' : 'login')
        // Limpar os formulários ao alternar
        setLoginData({ email: '', password: '' })
        setRegisterData({ name: '', email: '', password: '' })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl text-center">
                        {mode === 'login' ? 'Entrar' : 'Criar conta'}
                    </CardTitle>
                    <CardDescription className="text-center">
                        {mode === 'login'
                            ? 'Entre com suas credenciais para acessar sua conta'
                            : 'Crie uma nova conta para começar'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {mode === 'login' ? (
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="login-email">Email</Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={loginData.email}
                                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="login-password">Senha</Label>
                                <Input
                                    id="login-password"
                                    type="password"
                                    placeholder="Sua senha"
                                    value={loginData.password}
                                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                Entrar
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegisterSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="register-name">Nome</Label>
                                <Input
                                    id="register-name"
                                    type="text"
                                    placeholder="Seu nome completo"
                                    value={registerData.name}
                                    onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="register-email">Email</Label>
                                <Input
                                    id="register-email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={registerData.email}
                                    onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="register-password">Senha</Label>
                                <Input
                                    id="register-password"
                                    type="password"
                                    placeholder="Crie uma senha"
                                    value={registerData.password}
                                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                Criar conta
                            </Button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                        </p>
                        <Button
                            type="button"
                            variant="link"
                            onClick={toggleMode}
                            className="mt-1 p-0 h-auto font-semibold"
                        >
                            {mode === 'login' ? 'Criar conta' : 'Entrar'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}