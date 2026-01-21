// Authentication Utility Functions

const Auth = {
    // Get current user session
    async getCurrentUser() {
        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if (error) throw error;
            
            if (session?.user) {
                // Get user profile from database
                const { data: profile } = await supabaseClient
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                return { user: session.user, profile };
            }
            return null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    },

    // Register new user
    async register(userData) {
        try {
            const { firstName, lastName, username, email, password, role } = userData;
            
            // Create auth user with email
            const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        username: username
                    }
                }
            });

            if (authError) throw authError;

            // Create user profile in database
            const { error: profileError } = await supabaseClient
                .from('users')
                .insert([{
                    id: authData.user.id,
                    first_name: firstName,
                    last_name: lastName,
                    username: username,
                    email: email,
                    role: role,
                    status: role === 'seller' ? 'pending' : 'active',
                    created_at: new Date().toISOString()
                }]);

            if (profileError) throw profileError;

            return { success: true, user: authData.user };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
        }
    },

    // Login with email and password
    async login(email, password) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // Get user profile
            const { data: profile } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

            // Check if seller is approved
            if (profile.role === 'seller' && profile.status !== 'approved') {
                await this.logout();
                throw new Error('Your seller account is pending approval');
            }

            return { success: true, user: data.user, profile };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    },

    // Login with Discord
    async loginWithDiscord() {
        try {
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'discord',
                options: {
                    redirectTo: window.discordConfig.redirectUri
                }
            });

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Discord login error:', error);
            return { success: false, error: error.message };
        }
    },

    // Logout
    async logout() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            window.location.href = '/index.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    // Check if user is authenticated
    async isAuthenticated() {
        const user = await this.getCurrentUser();
        return user !== null;
    },

    // Protect page (redirect if not authenticated)
    async protectPage() {
        const user = await this.getCurrentUser();
        if (!user) {
            window.location.href = '/login.html';
            return null;
        }
        return user;
    },

    // Check if user is admin
    async isAdmin() {
        const user = await this.getCurrentUser();
        return user?.profile?.role === 'admin';
    },

    // Protect admin page
    async protectAdminPage() {
        const user = await this.protectPage();
        if (user && user.profile.role !== 'admin') {
            alert('Access denied. Admin only.');
            window.location.href = '/dashboard.html';
            return null;
        }
        return user;
    }
};

// Export for global use
window.Auth = Auth;
