`timescale 1ns / 1ps
//////////////////////////////////////////////////////////////////////////////////
// Project : QuantumRISC
// Module  : Register File
// Author  : Chandu Vemula
//
// Features:
// - 32 Registers (x0 - x31)
// - 32-bit Width
// - Two Read Ports
// - One Write Port
// - x0 is Hardwired to Zero
//////////////////////////////////////////////////////////////////////////////////

module register_file(

    input  logic        clk,
    input  logic        we,

    input  logic [4:0]  rs1,
    input  logic [4:0]  rs2,
    input  logic [4:0]  rd,

    input  logic [31:0] write_data,

    output logic [31:0] read_data1,
    output logic [31:0] read_data2

);

logic [31:0] registers [0:31];

integer i;

initial begin
    for(i=0;i<32;i=i+1)
        registers[i]=32'b0;
end

always_ff @(posedge clk) begin

    if(we && rd!=0)
        registers[rd] <= write_data;

    registers[0] <= 32'b0;

end

assign read_data1 = registers[rs1];
assign read_data2 = registers[rs2];

endmodule