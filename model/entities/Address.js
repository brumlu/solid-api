export class Address {
    constructor({ 
        id, 
        street, 
        number, 
        complement = null, 
        neighborhood, 
        city, 
        state, 
        zipCode, 
        userId,
        createdAt = new Date(), 
        updatedAt = new Date() 
    }) {
        this.id = id;
        this.street = street;
        this.number = number;
        this.complement = complement;
        this.neighborhood = neighborhood;
        this.city = city;
        this.state = state;
        this.zipCode = zipCode;
        this.userId = userId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;

    if (!street) throw new Error("Street is required");
    }
}