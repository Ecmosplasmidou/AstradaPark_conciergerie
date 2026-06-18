import { Injectable, ConflictException, UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  // Inscription
  async signUp(authData: any): Promise<User> {
    const { email, password, nom, prenom, cars } = authData;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await this.userModel.findOne({ email });
    if (userExists) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hashage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      nom,
      prenom,
      email,
      password: hashedPassword,
      cars: cars || [], // On initialise avec les voitures envoyées ou un tableau vide
    });

    return user.save();
  }

  // Connexion
  async login(loginData: any) {
    const { email, password } = loginData;
    const user = await this.userModel.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const payload = { 
        email: user.email, 
        sub: user._id, 
        role: user.role 
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          _id: user._id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role,
          cars: user.cars,
        },
      };
    } else {
      throw new UnauthorizedException('Identifiants incorrects');
    }
  }

  // MISE À JOUR DU PROFIL (La route qui manquait)
  async updateProfile(userId: string, updateData: any) {
    // Sécurité : on empêche la modification du rôle ou de l'email via cette route simple
    delete updateData.role;
    delete updateData.password;

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }, // Retourne l'utilisateur après modification
    ).exec();

    if (!updatedUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const { password, ...result } = updatedUser.toObject();
    return result;
  }

  async findAllUsers(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async updateUserById(id: string, data: any): Promise<User> {
    delete data.role;
    delete data.password;
    const updated = await this.userModel.findByIdAndUpdate(id, { $set: data }, { new: true }).select('-password').exec();
    if (!updated) throw new NotFoundException('Utilisateur non trouvé');
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userModel.findById(id).exec();
    if (user?.role === 'admin') throw new ForbiddenException('Impossible de supprimer un administrateur');
    await this.userModel.findByIdAndDelete(id).exec();
  }
}